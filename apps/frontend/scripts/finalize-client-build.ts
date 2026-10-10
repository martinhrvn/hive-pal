/**
 * Post-build step run from `react-router.config.ts` (`buildEnd`) once React
 * Router has written the client build and the prerendered pages.
 *
 * React Router leaves the output as `<path>/index.html` per prerendered URL,
 * `index.html` for the prerendered `/`, and the SPA shell as
 * `__spa-fallback.html`. The backend wants:
 *
 *   dist/client/index.html                 the SPA shell (fallback for every
 *                                          app route and for logged-in visitors)
 *   dist/client/__prerender/<path>/index.html
 *                                          the prerendered, logged-out public
 *                                          pages ('/' -> __prerender/index.html)
 *   dist/client/sitemap.xml
 *   dist/client/sw.js (+ workbox runtime)
 *
 * Moving the prerendered pages under one directory also keeps directories like
 * `features/` or `da/` away from the static root, where express.static would
 * answer `/features` with a redirect to `/features/`.
 */
import { existsSync } from 'node:fs';
import { mkdir, readdir, rename, rm, rmdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { generateSW } from 'workbox-build';
import {
  buildSitemap,
  type PrerenderPlan,
} from '../src/routes/public-routes.server';

export const PRERENDER_DIR = '__prerender';
const SPA_FALLBACK = '__spa-fallback.html';

function prerenderedFile(clientDir: string, urlPath: string): string {
  return path.join(clientDir, urlPath.replace(/^\//, ''), 'index.html');
}

/** Removes `dir` and its parents while they are empty, stopping at `stopAt`. */
async function pruneEmptyDirs(dir: string, stopAt: string): Promise<void> {
  let current = dir;
  while (current !== stopAt && current.startsWith(stopAt)) {
    const entries = await readdir(current).catch(() => null);
    if (entries === null || entries.length > 0) return;
    await rmdir(current);
    current = path.dirname(current);
  }
}

async function movePrerenderedPages(
  clientDir: string,
  plan: PrerenderPlan,
): Promise<void> {
  const target = path.join(clientDir, PRERENDER_DIR);
  await rm(target, { recursive: true, force: true });

  for (const page of plan.pages) {
    const from = prerenderedFile(clientDir, page.path);
    if (!existsSync(from)) {
      throw new Error(
        `Prerendered page for ${page.path} is missing (expected ${from})`,
      );
    }
    const to = prerenderedFile(target, page.path);
    await mkdir(path.dirname(to), { recursive: true });
    await rename(from, to);
    await pruneEmptyDirs(path.dirname(from), clientDir);
  }

  const fallback = path.join(clientDir, SPA_FALLBACK);
  const index = path.join(clientDir, 'index.html');
  if (existsSync(fallback)) {
    await rename(fallback, index);
  } else if (!existsSync(index)) {
    throw new Error(
      'SPA shell not found: neither __spa-fallback.html nor index.html exists',
    );
  }
}

async function buildServiceWorker(clientDir: string): Promise<void> {
  const { count, size, warnings } = await generateSW({
    globDirectory: clientDir,
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
    // Prerendered public pages are SEO documents, not app shell: keep them out
    // of the precache (they are many, and offline navigation falls back to the
    // shell, which renders them client-side anyway).
    globIgnores: [`${PRERENDER_DIR}/**`],
    swDest: path.join(clientDir, 'sw.js'),
    mode: 'production',
    sourcemap: false,
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    // Deliberately no `skipWaiting`: inspections are long forms, so a new
    // deployment must never swap itself in and reload the page while a
    // beekeeper is typing. A freshly installed worker stays in "waiting" until
    // the user accepts the update prompt (PWAUpdatePrompt), which then sends
    // SKIP_WAITING (workbox's generated worker listens for that message).
    skipWaiting: false,
    // The service worker falls back to the SPA shell for navigation requests.
    // Backend-handled routes (API + better-auth, e.g. the magic-link verify link
    // opened directly in the browser) must NOT be served the shell, otherwise
    // they never reach the server. The static SEO files (sitemap.xml,
    // robots.txt, llms.txt) are real files served by the backend; without these
    // entries the SW answers a direct browser navigation to them with the
    // cached shell instead.
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [
      /^\/api\//,
      /^\/env\.js$/,
      /^\/sitemap\.xml$/,
      /^\/robots\.txt$/,
      /^\/llms\.txt$/,
    ],
    runtimeCaching: [
      {
        // Cache locale/translation files
        urlPattern: /\/locales\/.*\.json$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'locales-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 7,
          },
        },
      },
    ],
  });
  for (const warning of warnings) console.warn(`[sw] ${warning}`);
  console.log(
    `[sw] precaching ${count} files (${(size / 1024).toFixed(0)} KiB) in sw.js`,
  );
}

export async function finalizeClientBuild(
  clientDir: string,
  plan: PrerenderPlan,
): Promise<void> {
  await movePrerenderedPages(clientDir, plan);
  await writeFile(
    path.join(clientDir, 'sitemap.xml'),
    buildSitemap(plan),
    'utf-8',
  );
  console.log(
    `[prerender] ${plan.pages.length} pages moved under ${PRERENDER_DIR}/, sitemap.xml written`,
  );
  await buildServiceWorker(clientDir);
}
