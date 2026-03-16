import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createZendeskClient } from './routes/zendesk-client.js';
import { createSsoRouter } from './routes/sso.js';
import { createHelpCenterRouter } from './routes/help-center.js';

const {
  ZENDESK_SHARED_SECRET = '',
  ZENDESK_SUBDOMAIN = 'lifebyte-28216',
  ZENDESK_RETURN_TO = 'https://lifebyte-28216.zendesk.com/agent/home/tickets',
  ZENDESK_API_EMAIL = '',
  ZENDESK_API_TOKEN = '',
  PORT = '3001',
} = process.env;

const app = express();
app.use(cors());
app.use(express.json());

const zdClient = createZendeskClient({
  subdomain: ZENDESK_SUBDOMAIN,
  apiEmail: ZENDESK_API_EMAIL,
  apiToken: ZENDESK_API_TOKEN,
});

app.use('/zendesk', createSsoRouter({
  sharedSecret: ZENDESK_SHARED_SECRET,
  subdomain: ZENDESK_SUBDOMAIN,
  returnTo: ZENDESK_RETURN_TO,
}));

app.use('/zendesk/hc', createHelpCenterRouter({
  apiEmail: ZENDESK_API_EMAIL,
  apiToken: ZENDESK_API_TOKEN,
  subdomain: ZENDESK_SUBDOMAIN,
  zdClient,
}));

app.listen(Number(PORT), () => {
  console.log(`\n  Zendesk Bridge Server running at http://localhost:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/zendesk/health`);
  console.log(`  Bridge page:  http://localhost:${PORT}/zendesk/bridge`);
  console.log(`\n  Zendesk subdomain: ${ZENDESK_SUBDOMAIN}`);
  console.log(`  Shared secret:    ${ZENDESK_SHARED_SECRET ? 'configured' : '⚠ NOT SET'}\n`);
});
