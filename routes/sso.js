import crypto from 'node:crypto';
import { Router } from 'express';
import jwt from 'jsonwebtoken';

function createSsoRouter({ sharedSecret, subdomain, returnTo }) {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      config: {
        subdomain,
        returnTo,
        hasSecret: sharedSecret.length > 0,
        secretPreview: sharedSecret.length > 0
          ? `${sharedSecret.slice(0, 4)}...${sharedSecret.slice(-4)}`
          : '(empty)',
      },
    });
  });

  router.get('/bridge', (req, res) => {
    const {
      target = returnTo,
      email = 'demo@example.com',
      name = 'Demo User',
      external_id = '12345',
    } = req.query;

    if (!sharedSecret) {
      res.status(500).type('html').send(`
        <!doctype html>
        <html><body style="font-family:system-ui;padding:40px">
          <h2 style="color:#dc2626">ZENDESK_SHARED_SECRET is not configured</h2>
          <p>Copy <code>.env.example</code> to <code>.env</code> and fill in the real shared secret from Zendesk Admin &gt; Security &gt; SSO.</p>
        </body></html>
      `);
      return;
    }

    const payload = {
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID(),
      email: String(email),
      name: String(name),
      external_id: String(external_id),
    };

    const token = jwt.sign(payload, sharedSecret, { algorithm: 'HS256' });
    const action = `https://${subdomain}.zendesk.com/access/jwt`;

    res.type('html').send(`<!doctype html>
<html>
<head><meta charset="utf-8"><title>Zendesk SSO Bridge</title></head>
<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5">
  <div style="text-align:center">
    <p style="color:#666">Redirecting to Zendesk Help Center...</p>
    <noscript>
      <form method="POST" action="${action}">
        <input type="hidden" name="jwt" value="${token}" />
        <input type="hidden" name="return_to" value="${String(target)}" />
        <button type="submit">Click here to continue</button>
      </form>
    </noscript>
  </div>
  <form id="zd" method="POST" action="${action}" style="display:none">
    <input type="hidden" name="jwt" value="${token}" />
    <input type="hidden" name="return_to" value="${String(target)}" />
  </form>
  <script>document.getElementById('zd').submit();</script>
</body>
</html>`);
  });

  return router;
}

export { createSsoRouter };
