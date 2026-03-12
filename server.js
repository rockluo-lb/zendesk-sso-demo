import 'dotenv/config';
import crypto from 'node:crypto';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();

const {
  ZENDESK_SHARED_SECRET = '',
  ZENDESK_SUBDOMAIN = 'lifebyte-28216',
  ZENDESK_RETURN_TO = 'https://lifebyte-28216.zendesk.com/agent/home/tickets',
  PORT = '3001',
} = process.env;

app.use(cors());

app.get('/zendesk/health', (_req, res) => {
  res.json({
    status: 'ok',
    config: {
      subdomain: ZENDESK_SUBDOMAIN,
      returnTo: ZENDESK_RETURN_TO,
      hasSecret: ZENDESK_SHARED_SECRET.length > 0,
      secretPreview: ZENDESK_SHARED_SECRET.length > 0
        ? `${ZENDESK_SHARED_SECRET.slice(0, 4)}...${ZENDESK_SHARED_SECRET.slice(-4)}`
        : '(empty)',
    },
  });
});

app.get('/zendesk/bridge', (req, res) => {
  const {
    target = ZENDESK_RETURN_TO,
    email = 'demo@example.com',
    name = 'Demo User',
    external_id = '12345',
  } = req.query;

  if (!ZENDESK_SHARED_SECRET) {
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

  const token = jwt.sign(payload, ZENDESK_SHARED_SECRET, { algorithm: 'HS256' });

  const action = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/access/jwt`;

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

app.listen(Number(PORT), () => {
  console.log(`\n  Zendesk Bridge Server running at http://localhost:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/zendesk/health`);
  console.log(`  Bridge page:  http://localhost:${PORT}/zendesk/bridge`);
  console.log(`\n  Zendesk subdomain: ${ZENDESK_SUBDOMAIN}`);
  console.log(`  Shared secret:    ${ZENDESK_SHARED_SECRET ? 'configured' : '⚠ NOT SET'}\n`);
});
