import * as Sentry from '@sentry/react';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';
import { PrerenderContext } from '@/context/prerender-context';
import { readPrerenderPayload } from '@/lib/i18n-client';
import './lib/i18n';
import { initFaro } from './lib/faro';

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

// The service worker is registered exactly once, from PWAUpdatePrompt (rendered
// by the root route), because that component also needs the registration's
// update state.

// A prerendered public page ships the data its server render used (language,
// translation bundles, available languages) so the first client render matches
// the markup byte for byte; see entry.server.tsx.
const prerender = readPrerenderPayload();

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <PrerenderContext.Provider value={prerender}>
        <HydratedRouter />
      </PrerenderContext.Provider>
    </StrictMode>,
  );
});
