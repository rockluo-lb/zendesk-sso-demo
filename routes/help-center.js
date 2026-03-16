import { Router } from 'express';

function createHelpCenterRouter({ apiEmail, apiToken, subdomain, zdClient }) {
  const router = Router();
  const { base, auth, tlsAgent, hcProxy } = zdClient;

  router.get('/health', (_req, res) => {
    res.json({ hasApiToken: apiToken.length > 0, apiEmail, subdomain });
  });

  // ── Categories ──
  router.get('/categories', hcProxy('/api/v2/help_center/categories'));
  router.post('/categories', hcProxy('/api/v2/help_center/categories'));
  router.put('/categories/:id', hcProxy((req) => `/api/v2/help_center/categories/${req.params.id}`));
  router.delete('/categories/:id', hcProxy((req) => `/api/v2/help_center/categories/${req.params.id}`));

  // ── Sections ──
  router.get('/categories/:id/sections', hcProxy((req) => `/api/v2/help_center/categories/${req.params.id}/sections`));
  router.post('/categories/:id/sections', hcProxy((req) => `/api/v2/help_center/categories/${req.params.id}/sections`));
  router.get('/sections/:id', hcProxy((req) => `/api/v2/help_center/sections/${req.params.id}`));
  router.put('/sections/:id', hcProxy((req) => `/api/v2/help_center/sections/${req.params.id}`));
  router.delete('/sections/:id', hcProxy((req) => `/api/v2/help_center/sections/${req.params.id}`));

  // ── Articles ──
  router.get('/sections/:id/articles', hcProxy((req) => `/api/v2/help_center/sections/${req.params.id}/articles`));
  router.post('/sections/:id/articles', hcProxy((req) => `/api/v2/help_center/sections/${req.params.id}/articles`));
  router.get('/articles/:id', hcProxy((req) => `/api/v2/help_center/articles/${req.params.id}`));
  router.put('/articles/:id', hcProxy((req) => `/api/v2/help_center/articles/${req.params.id}`));
  router.delete('/articles/:id', hcProxy((req) => `/api/v2/help_center/articles/${req.params.id}`));

  // ── Translations ──
  router.put('/articles/:id/translations/:locale', hcProxy((req) => `/api/v2/help_center/articles/${req.params.id}/translations/${req.params.locale}`));

  // ── Attachments ──
  router.get('/articles/:id/attachments', hcProxy((req) => `/api/v2/help_center/articles/${req.params.id}/attachments`));
  router.post('/articles/:id/attachments', async (req, res) => {
    const url = `${base}/api/v2/help_center/articles/${req.params.id}/attachments`;
    const headers = {};
    if (auth) headers['Authorization'] = auth;
    if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
    const result = await fetch(url, {
      method: 'POST',
      headers,
      body: req,
      duplex: 'half',
      dispatcher: tlsAgent,
    }).then(async (r) => ({ status: r.status, data: await r.json().catch(() => null) }))
      .catch((err) => ({ status: 502, data: { error: err.message } }));
    res.status(result.status).json(result.data);
  });
  router.delete('/attachments/:id', hcProxy((req) => `/api/v2/help_center/articles/attachments/${req.params.id}`));

  // ── Misc ──
  router.get('/permission_groups', hcProxy('/api/v2/guide/permission_groups'));
  router.get('/user_segments', hcProxy('/api/v2/help_center/user_segments'));
  router.get('/search', hcProxy((req) => `/api/v2/help_center/articles/search?query=${encodeURIComponent(req.query.query ?? '')}`));

  return router;
}

export { createHelpCenterRouter };
