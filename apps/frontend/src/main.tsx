import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import './lib/i18n';
import App from './App.tsx';

// Handle chunk load errors from version skew (new deploy with old chunks cached)
window.addEventListener('vite:preloadError', () => {
  const lastReload = Number(
    sessionStorage.getItem('last_chunk_reload') || '0',
  );
  if (Date.now() - lastReload > 10_000) {
    sessionStorage.setItem('last_chunk_reload', String(Date.now()));
    window.location.reload();
  }
});

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
