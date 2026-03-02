import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import './lib/i18n';
import App from './App.tsx';

const sentryDsn =
  window.ENV?.VITE_SENTRY_DSN || import.meta.env.VITE_SENTRY_DSN;
const sentryEnv =
  window.ENV?.VITE_SENTRY_ENVIRONMENT ||
  import.meta.env.VITE_SENTRY_ENVIRONMENT ||
  'development';

Sentry.init({
  dsn: sentryDsn,
  environment: sentryEnv,
  sendDefaultPii: true,
  sendClientReports: true,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
