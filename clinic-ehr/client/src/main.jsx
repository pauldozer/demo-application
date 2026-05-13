import React from 'react';
import ReactDOM from 'react-dom/client';
import { App, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import './index.css';
import AppRouter from './App';

dayjs.extend(relativeTime);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary:    '#1677ff',
          colorSuccess:    '#52c41a',
          colorWarning:    '#fa8c16',
          colorError:      '#ff4d4f',
          borderRadius:    6,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: 14
        },
        components: {
          Layout: { siderBg: '#001529' },
          Table:  { rowHoverBg: '#f0f7ff' }
        }
      }}
    >
      <App>
        <AppRouter />
      </App>
    </ConfigProvider>
  </React.StrictMode>
);
