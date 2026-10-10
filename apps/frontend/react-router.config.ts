import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Config } from '@react-router/dev/config';
import { buildPrerenderPlan } from './src/routes/public-routes.server';
import { finalizeClientBuild } from './scripts/finalize-client-build';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(ROOT, 'public', 'locales');
const CLIENT_DIR = path.join(ROOT, 'dist', 'client');

/**
 * Hive Pal is a single-page app (`ssr: false`); the backend serves the static
 * build. The public marketing/tool pages are additionally prerendered to HTML
 * for every language they are translated in (see `public-routes.server.ts`),
 * which is what makes them crawlable and localized for search engines.
 *
 * `buildEnd` arranges the output the way the backend expects it (see
 * `scripts/finalize-client-build.ts`): prerendered pages under `__prerender/`,
 * the SPA shell as `index.html`, plus `sitemap.xml` and the service worker.
 */
export default {
  appDirectory: 'src',
  buildDirectory: 'dist',
  ssr: false,
  prerender: () => buildPrerenderPlan(LOCALES_DIR).pages.map(page => page.path),
  buildEnd: async () => {
    await finalizeClientBuild(CLIENT_DIR, buildPrerenderPlan(LOCALES_DIR));
  },
} satisfies Config;
