import { ConfigProvider } from 'antd';
import { ZendeskDemo } from './ZendeskDemo';

function App() {
  return (
    <ConfigProvider theme={{ cssVar: true }}>
      <ZendeskDemo />
    </ConfigProvider>
  );
}

export { App };
