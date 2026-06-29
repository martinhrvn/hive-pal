import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import './lib/i18n';
import { initFaro } from './lib/faro';
import App from './App.tsx';

// Register PWA service worker using auto-update behavior.
// This keeps deployed clients fresher without requiring a manual hard refresh.
registerSW({
  onRegisteredSW(swUrl, registration) {
    if (!registration) return;

    // Optional periodic update check while the app stays open.
    // Helps long-lived tabs pick up new deployments sooner.
    if (import.meta.env.PROD) {
      window.setInterval(() => {
        registration.update().catch(() => {
          // ignore update polling errors
        });
      }, 60 * 60 * 1000);
    }

    console.debug('[PWA] service worker registered:', swUrl);
  },
  onRegisterError(error) {
    console.error('[PWA] service worker registration error', error);
  },
  onOfflineReady() {
    console.debug('[PWA] app ready to work offline');
  },
});

// Handle chunk load errors from version skew (new deploy with old chunks cached)
window.addEventListener('vite:preloadError', () => {
  const lastReload = Number(sessionStorage.getItem('last_chunk_reload') || '0');

  if (Date.now() - lastReload > 30_000) {
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

// Grafana Faro real-user monitoring (Web Vitals -> Alloy -> Loki -> Grafana).
// No-op unless VITE_FARO_URL is configured.
initFaro();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);