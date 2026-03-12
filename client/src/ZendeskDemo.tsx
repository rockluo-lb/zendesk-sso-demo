import {
  Alert,
  Badge,
  Button,
  Card,
  Descriptions,
  Drawer,
  Flex,
  Form,
  Input,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useRef, useState } from 'react';

const { Title, Text, Paragraph } = Typography;

type IframeStatus = 'idle' | 'loading' | 'loaded' | 'blocked' | 'timeout';
type HealthStatus = 'checking' | 'ok' | 'error';
type LogType = 'info' | 'success' | 'warning' | 'error';
type LogEntry = { time: string; message: string; type: LogType };

type Config = {
  target: string;
  email: string;
  name: string;
  externalId: string;
};

const DEFAULT_CONFIG: Config = {
  target: 'https://lifebyte-28216.zendesk.com/hc/en-us',
  email: 'rock.luo@lifebyte.io',
  name: 'Rock Luo',
  externalId: '12345',
};

const IFRAME_TIMEOUT_MS = 8000;

function buildBridgeUrl(config: Config) {
  const params = new URLSearchParams({
    target: config.target,
    email: config.email,
    name: config.name,
    external_id: config.externalId,
  });
  return `/zendesk/bridge?${params.toString()}`;
}

function ts() {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    fractionalSecondDigits: 3,
  });
}

function ZendeskDemo() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('checking');
  const [healthData, setHealthData] = useState<Record<string, unknown> | null>(null);

  const [iframeStatus, setIframeStatus] = useState<IframeStatus>('idle');
  const [iframeSrc, setIframeSrc] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSrc, setDrawerSrc] = useState('');
  const [drawerStatus, setDrawerStatus] = useState<IframeStatus>('idle');
  const drawerIframeRef = useRef<HTMLIFrameElement>(null);
  const drawerTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const log = (message: string, type: LogType = 'info') => {
    setLogs((prev) => [...prev, { time: ts(), message, type }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setHealthStatus('checking');
    log('Checking Express backend health...');
    const res = await fetch('/zendesk/health').catch(() => null);
    if (!res?.ok) {
      setHealthStatus('error');
      log('Express backend is not reachable.', 'error');
      return;
    }
    const data = await res.json();
    setHealthData(data.config);
    setHealthStatus('ok');
    log(
      `Backend connected. Subdomain: ${data.config.subdomain}, Secret: ${data.config.hasSecret ? 'configured' : 'NOT SET'}`,
      data.config.hasSecret ? 'success' : 'warning',
    );
  };

  const startTimeout = (
    setter: React.Dispatch<React.SetStateAction<IframeStatus>>,
    ref: React.MutableRefObject<ReturnType<typeof setTimeout> | undefined>,
    label: string,
  ) => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(() => {
      setter((prev) => {
        if (prev === 'loading') {
          log(`${label} iframe timed out after ${IFRAME_TIMEOUT_MS}ms — likely blocked by X-Frame-Options or CSP.`, 'error');
          return 'timeout';
        }
        return prev;
      });
    }, IFRAME_TIMEOUT_MS);
  };

  const handleNewWindow = () => {
    const url = buildBridgeUrl(config);
    log(`Opening new tab: ${url}`);
    window.open(url, '_blank', 'noopener,noreferrer');
    log('New tab opened. Check the new tab for Zendesk Help Center.', 'success');
  };

  const popupRef = useRef<Window | null>(null);

  const handlePopup = () => {
    const url = buildBridgeUrl(config);
    const width = Math.min(1200, Math.round(screen.width * 0.8));
    const height = Math.min(800, Math.round(screen.height * 0.8));
    const left = Math.round((screen.width - width) / 2);
    const top = Math.round((screen.height - height) / 2);
    const features = `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes`;

    log(`Opening popup: ${width}x${height} at (${left},${top})`);
    popupRef.current = window.open(url, 'zendesk_popup', features);

    if (popupRef.current) {
      popupRef.current.focus();
      log('Popup opened successfully. Zendesk SSO flow started.', 'success');
    } else {
      log('Popup was blocked by the browser. Please allow popups for this site.', 'error');
    }
  };

  const handleInlineIframe = () => {
    const url = buildBridgeUrl(config);
    log(`Loading inline iframe: ${url}`);
    setIframeStatus('loading');
    setIframeSrc(url);
    startTimeout(setIframeStatus, timeoutRef, 'Inline');
  };

  const handleInlineLoad = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIframeStatus('loaded');
    log('Inline iframe onload fired.', 'success');
    if (iframeRef.current && !iframeRef.current.contentWindow) {
      setIframeStatus('blocked');
      log('Inline iframe blocked (no contentWindow).', 'error');
    }
  };

  const handleInlineError = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIframeStatus('blocked');
    log('Inline iframe onerror — blocked by browser.', 'error');
  };

  const handleDrawer = () => {
    const url = buildBridgeUrl(config);
    log(`Opening Drawer iframe: ${url}`);
    setDrawerStatus('loading');
    setDrawerSrc(url);
    setDrawerOpen(true);
    startTimeout(setDrawerStatus, drawerTimeoutRef, 'Drawer');
  };

  const handleDrawerLoad = () => {
    if (drawerTimeoutRef.current) clearTimeout(drawerTimeoutRef.current);
    setDrawerStatus('loaded');
    log('Drawer iframe onload fired.', 'success');
    if (drawerIframeRef.current && !drawerIframeRef.current.contentWindow) {
      setDrawerStatus('blocked');
      log('Drawer iframe blocked (no contentWindow).', 'error');
    }
  };

  const handleDrawerError = () => {
    if (drawerTimeoutRef.current) clearTimeout(drawerTimeoutRef.current);
    setDrawerStatus('blocked');
    log('Drawer iframe onerror — blocked.', 'error');
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerSrc('');
    setDrawerStatus('idle');
    if (drawerTimeoutRef.current) clearTimeout(drawerTimeoutRef.current);
  };

  const fallback = () => {
    log('Falling back to new window...');
    handleNewWindow();
  };

  const ready = healthStatus === 'ok';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Title level={3} style={{ margin: 0 }}>Zendesk Help Center — JWT SSO Demo</Title>

      <Paragraph type="secondary" style={{ margin: 0 }}>
        Verifies the full JWT SSO flow: Express BridgePage generates a JWT, browser form-POSTs it to
        Zendesk <code>/access/jwt</code>, then redirects to Help Center. Four display modes are tested.
      </Paragraph>

      <Card title="Backend Status" size="small">
        <Flex align="center" gap={12}>
          <Badge
            status={healthStatus === 'ok' ? 'success' : healthStatus === 'error' ? 'error' : 'processing'}
            text={healthStatus === 'ok' ? 'Connected' : healthStatus === 'error' ? 'Unreachable' : 'Checking...'}
          />
          <Button size="small" onClick={checkHealth}>Refresh</Button>
        </Flex>
        {healthData && (
          <Descriptions size="small" column={2} style={{ marginTop: 12 }}>
            <Descriptions.Item label="Subdomain">{String(healthData.subdomain)}</Descriptions.Item>
            <Descriptions.Item label="Secret">
              {healthData.hasSecret
                ? <Tag color="green">{String(healthData.secretPreview)}</Tag>
                : <Tag color="red">NOT SET</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Return To">{String(healthData.returnTo)}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="Configuration" size="small">
        <Form layout="vertical" size="small">
          <Flex gap={16} wrap="wrap">
            <Form.Item label="Help Center Target URL" style={{ flex: 1, minWidth: 300 }}>
              <Input value={config.target} onChange={(e) => setConfig((c) => ({ ...c, target: e.target.value }))} />
            </Form.Item>
            <Form.Item label="Email" style={{ minWidth: 200 }}>
              <Input value={config.email} onChange={(e) => setConfig((c) => ({ ...c, email: e.target.value }))} />
            </Form.Item>
            <Form.Item label="Name" style={{ minWidth: 150 }}>
              <Input value={config.name} onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))} />
            </Form.Item>
            <Form.Item label="External ID" style={{ minWidth: 100 }}>
              <Input value={config.externalId} onChange={(e) => setConfig((c) => ({ ...c, externalId: e.target.value }))} />
            </Form.Item>
          </Flex>
        </Form>
      </Card>

      <Card title="Test Modes" size="small">
        <Flex gap={12} wrap="wrap">
          <Button type="primary" onClick={handleNewWindow} disabled={!ready}>A — New Tab</Button>
          <Button type="primary" onClick={handlePopup} disabled={!ready}>D — Popup Window</Button>
          <Button onClick={handleInlineIframe} disabled={!ready}>B — Inline iframe</Button>
          <Button onClick={handleDrawer} disabled={!ready}>C — Drawer iframe</Button>
        </Flex>
        {!ready && (
          <Alert
            type="warning"
            showIcon
            message="Start the Express backend first: node server.js"
            style={{ marginTop: 12 }}
          />
        )}
      </Card>

      {iframeSrc && (
        <Card
          title={<Flex align="center" gap={8}><span>Inline iframe</span><StatusTag status={iframeStatus} /></Flex>}
          size="small"
          extra={
            (iframeStatus === 'blocked' || iframeStatus === 'timeout') &&
            <Button size="small" type="link" onClick={fallback}>Fallback: Open in New Window</Button>
          }
        >
          {iframeStatus === 'loading' && (
            <Flex justify="center" style={{ padding: '32px 0' }}><Spin tip="Loading..." /></Flex>
          )}
          <iframe
            ref={iframeRef}
            title="zendesk-hc-inline"
            src={iframeSrc}
            onLoad={handleInlineLoad}
            onError={handleInlineError}
            style={{
              width: '100%',
              height: '70vh',
              border: 0,
              display: iframeStatus === 'loading' ? 'none' : 'block',
            }}
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation"
          />
        </Card>
      )}

      <Card title="Console Logs" size="small">
        <div style={{
          maxHeight: 250,
          overflowY: 'auto',
          background: '#111',
          borderRadius: 6,
          padding: 12,
          fontFamily: 'monospace',
          fontSize: 12,
        }}>
          {logs.length === 0 && <Text style={{ color: '#666' }}>No logs yet.</Text>}
          {logs.map((entry, i) => (
            <div key={i} style={{ lineHeight: '20px' }}>
              <span style={{ color: '#666' }}>[{entry.time}]</span>{' '}
              <span style={{
                color: entry.type === 'error' ? '#f87171'
                  : entry.type === 'warning' ? '#facc15'
                  : entry.type === 'success' ? '#4ade80'
                  : '#d1d5db',
              }}>
                {entry.message}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
        {logs.length > 0 && (
          <Button size="small" style={{ marginTop: 8 }} onClick={() => setLogs([])}>Clear</Button>
        )}
      </Card>

      <Drawer
        title={<Flex align="center" gap={8}><span>Zendesk Help Center</span><StatusTag status={drawerStatus} /></Flex>}
        placement="right"
        width="80%"
        open={drawerOpen}
        onClose={closeDrawer}
        extra={
          (drawerStatus === 'blocked' || drawerStatus === 'timeout') &&
          <Button size="small" onClick={fallback}>Open in New Window</Button>
        }
      >
        {drawerStatus === 'loading' && (
          <Flex justify="center" style={{ padding: '32px 0' }}><Spin tip="Loading..." /></Flex>
        )}
        {drawerSrc && (
          <iframe
            ref={drawerIframeRef}
            title="zendesk-hc-drawer"
            src={drawerSrc}
            onLoad={handleDrawerLoad}
            onError={handleDrawerError}
            style={{
              width: '100%',
              height: 'calc(100vh - 120px)',
              border: 0,
              display: drawerStatus === 'loading' ? 'none' : 'block',
            }}
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation"
          />
        )}
      </Drawer>
    </div>
  );
}

function StatusTag({ status }: { status: IframeStatus }) {
  const map = {
    idle: { color: 'default', label: 'Idle' },
    loading: { color: 'processing', label: 'Loading...' },
    loaded: { color: 'success', label: 'Loaded' },
    blocked: { color: 'error', label: 'Blocked' },
    timeout: { color: 'warning', label: 'Timeout' },
  } as const;
  const { color, label } = map[status];
  return <Tag color={color}>{label}</Tag>;
}

export { ZendeskDemo };
