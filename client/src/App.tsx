import { ConfigProvider, Tabs } from 'antd';
import { HelpCenterDemo } from './HelpCenterDemo';
import { ZendeskDemo } from './ZendeskDemo';

function App() {
  return (
    <ConfigProvider theme={{ cssVar: true }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        <Tabs
          defaultActiveKey="sso"
          items={[
            { key: 'sso', label: 'JWT SSO Demo', children: <ZendeskDemo /> },
            { key: 'hc', label: 'Help Center API', children: <HelpCenterDemo /> },
          ]}
        />
      </div>
    </ConfigProvider>
  );
}

export { App };
