import { Agent } from 'undici';

const tlsAgent = new Agent({ connect: { rejectUnauthorized: false } });

function createZendeskClient({ subdomain, apiEmail, apiToken }) {
  const base = `https://${subdomain}.zendesk.com`;
  const auth = apiToken
    ? `Basic ${Buffer.from(`${apiEmail}/token:${apiToken}`).toString('base64')}`
    : '';

  async function zdFetch(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (auth) headers['Authorization'] = auth;
    if (options.rawBody) delete headers['Content-Type'];

    const fetchInit = { method: options.method ?? 'GET', headers, dispatcher: tlsAgent };
    if (options.rawBody) {
      fetchInit.body = options.rawBody;
      fetchInit.duplex = 'half';
    } else if (options.body) {
      fetchInit.body = JSON.stringify(options.body);
    }

    const res = await fetch(`${base}${path}`, fetchInit);
    if (res.status === 204) return { status: 204, data: null };
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  function hcProxy(pathFn) {
    return async (req, res) => {
      const path = typeof pathFn === 'function' ? pathFn(req) : pathFn;
      const fetchOpts = { method: req.method };
      if (['POST', 'PUT'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
        fetchOpts.body = req.body;
      }
      const result = await zdFetch(path, fetchOpts).catch((err) => ({
        status: 502,
        data: { error: 'Zendesk API request failed', detail: String(err.cause ?? err.message) },
      }));
      res.status(result.status).json(result.data);
    };
  }

  return { base, auth, tlsAgent, zdFetch, hcProxy };
}

export { createZendeskClient };
