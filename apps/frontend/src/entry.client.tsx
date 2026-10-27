import * as Sentry from '@sentry/react';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';
import { PrerenderContext } from '@/context/prerender-context';
import { readPrerenderPayload } from '@/lib/i18n-client';
import './lib/i18n';
import { initFaro } from './lib/faro';

// Handle chunk load errors from version skew (new deploy with old chunks
// cached). `vite:preloadError` only fires for dynamic import failures; a stale
// <link rel="modulepreload"> or entry <script> — how vendor-*.js is first
// pulled in — 404s as a resource error instead, so both paths funnel into the
// same throttled reload.
function reloadOnceForVersionSkew() {
  const lastReload = Number(sessionStorage.getItem('last_chunk_reload') || '0');

  if (Date.now() - lastReload > 30_000) {
    sessionStorage.setItem('last_chunk_reload', String(Date.now()));
    window.location.reload();
  }
}

window.addEventListener('vite:preloadError', reloadOnceForVersionSkew);

// Only code and styles signal version skew. A failed image or other asset
// under /assets (missing file, offline PWA) must not reload the page and lose
// unsaved form input.
const SKEW_LINK_RELS = new Set(['modulepreload', 'stylesheet']);

function staleBuildAssetUrl(target: EventTarget | null): string | undefined {
  if (target instanceof HTMLScriptElement) return target.src;
  if (target instanceof HTMLLinkElement && SKEW_LINK_RELS.has(target.rel)) {
    return target.href;
  }
  return undefined;
}

// Resource load errors don't bubble, so capture-phase is required to see them.
window.addEventListener(
  'error',
  event => {
    const url = staleBuildAssetUrl(event.target);
    if (url?.includes('/assets/')) reloadOnceForVersionSkew();
  },
  true,
);

const CHUNK_LOAD_ERROR =
  /dynamically imported module|importing a module script|error loading dynamically imported/i;

function exceptionMessage(exception: unknown): string {
  if (exception instanceof Error) return exception.message;
  return typeof exception === 'string' ? exception : '';
}

const sentryDsn =
  window.ENV?.VITE_SENTRY_DSN || import.meta.env.VITE_SENTRY_DSN;
const sentryEnv =
  window.ENV?.VITE_SENTRY_ENVIRONMENT ||
  import.meta.env.VITE_SENTRY_ENVIRONMENT ||
  'development';

Sentry.init({
  dsn: sentryDsn,
  environment: sentryEnv,
  // Sentry 11 replaced sendDefaultPii with per-category switches that default
  // to "collect". userInfo keeps the previous IP/user capture; the GenAI
  // category is new in v11 and stays off so assistant prompts never leave the
  // browser with an error report.
  dataCollection: {
    userInfo: true,
    genAI: { inputs: false, outputs: false },
  },
  sendClientReports: true,
  // Version skew (a deploy replaced the hashed chunks while a stale tab was
  // open) rejects the dynamic import; the reload handler above self-heals it.
  // These are not actionable bugs, so drop them to keep Sentry clean.
  beforeSend(event, hint) {
    const message = event.message ?? exceptionMessage(hint?.originalException);
    return CHUNK_LOAD_ERROR.test(message) ? null : event;
  },
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
