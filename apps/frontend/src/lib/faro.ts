import {
  initializeFaro,
  getWebInstrumentations,
  faro,
} from '@grafana/faro-web-sdk';

let initialized = false;

/**
 * Reads a runtime/build config value. Runtime values served from the backend's
 * `/env.js` (`window.ENV`) take precedence over build-time `import.meta.env`,
 * mirroring how Sentry is configured in `main.tsx`.
 */
function readEnv(key: string): string | undefined {
  return window.ENV?.[key] || (import.meta.env[key] as string | undefined);
}

/**
 * Collapses a pathname to a coarse, low-cardinality "page" group so Web Vitals
 * can be broken down per area without exploding Loki/Prometheus cardinality.
 * Strips a leading language prefix (e.g. `/da/tools` -> `tools`) and keeps only
 * the first meaningful path segment: `/hives/123/edit` -> `hives`, `/` -> `home`.
 */
export function coarsePage(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  // Drop a 2-letter language prefix (da, sk, ...) when present.
  if (segments[0]?.length === 2) {
    segments.shift();
  }
  return segments[0] ?? 'home';
}

/**
 * Initializes Grafana Faro real-user monitoring. Faro's web instrumentations
 * automatically capture Core Web Vitals (LCP, CLS, INP, FCP, TTFB) plus errors
 * and session info, and ship them to the Alloy `faro.receiver` collector, which
 * forwards them to Loki for visualization in Grafana.
 *
 * No-op when `VITE_FARO_URL` is unset (e.g. local dev without a collector) or
 * outside the browser (SSR/prerender), so it is safe to call unconditionally.
 */
export function initFaro(): void {
  if (initialized || typeof window === 'undefined') return;

  const url = readEnv('VITE_FARO_URL');
  if (!url) return;

  const environment =
    readEnv('VITE_FARO_ENVIRONMENT') ||
    readEnv('VITE_SENTRY_ENVIRONMENT') ||
    'development';

  initializeFaro({
    url,
    app: {
      name: 'hivepal-frontend',
      version: import.meta.env.VITE_APP_VERSION || 'dev',
      environment,
    },
    instrumentations: [...getWebInstrumentations()],
  });

  initialized = true;
  setFaroView(window.location.pathname);
}

/**
 * Tags subsequent Faro signals (including Web Vitals measurements) with the
 * current coarse page, so dashboards can group p75 by page. Called on every
 * route change from the router subscription in `routes/index.tsx`.
 */
export function setFaroView(pathname: string): void {
  if (!initialized) return;
  faro.api.setView({ name: coarsePage(pathname) });
}
