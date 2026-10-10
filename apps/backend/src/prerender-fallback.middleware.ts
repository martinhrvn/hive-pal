import { existsSync, statSync } from 'fs';
import path from 'path';
import type { Request, Response, NextFunction } from 'express';

/**
 * Directory inside the static root that holds the prerendered public pages.
 * Written by the frontend build (`apps/frontend/scripts/finalize-client-build.ts`);
 * keep the two in sync.
 */
export const PRERENDER_DIR = '__prerender';

/**
 * Serves the prerendered, multilingual public pages.
 *
 * The frontend build writes `<PRERENDER_DIR>/<path>/index.html` for every public
 * route × language (e.g. `__prerender/index.html` for `/`,
 * `__prerender/da/tools/syrup-calculator/index.html`). For a navigation request
 * this middleware serves the matching file when it exists; everything else
 * (assets, locale JSON, the SPA shell `index.html` served by ServeStaticModule
 * for every other route) is left to ServeStaticModule.
 *
 * Registered in main.ts before ServeStaticModule (which registers in
 * onModuleInit, i.e. during listen()), so it sees navigation requests first.
 */
export function createPrerenderFallback(staticRoot: string) {
  const prerenderRoot = path.resolve(staticRoot, PRERENDER_DIR);
  const rootWithSep = prerenderRoot + path.sep;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();

    // Authenticated visitors get the SPA shell, not the prerendered logged-out
    // page — otherwise the public view would flash before the app view loads.
    // (Crawlers and logged-out visitors have no session cookie and get the
    // prerendered, SEO-friendly HTML.)
    if ((req.headers.cookie ?? '').includes('better-auth.session_token')) {
      return next();
    }

    const pathname = req.path;
    if (pathname.startsWith('/api') || pathname.startsWith('/assets/')) {
      return next();
    }

    let decoded: string;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      return next();
    }

    // '/' -> <root>/index.html, '/da/tools' and '/da/tools/' -> <root>/da/tools/index.html
    const relative = decoded.replace(/^\/+/, '').replace(/\/+$/, '');
    const candidate = path.resolve(prerenderRoot, relative, 'index.html');
    // Guard against path traversal escaping the prerender root.
    if (!candidate.startsWith(rootWithSep)) return next();

    if (existsSync(candidate) && statSync(candidate).isFile()) {
      res.sendFile(candidate);
      return;
    }

    next();
  };
}
