import { existsSync, statSync } from 'fs';
import path from 'path';
import type { Request, Response, NextFunction } from 'express';

/**
 * Serves prerendered, language-prefixed public pages.
 *
 * The frontend build writes flat `.html` files for every public route × language
 * (e.g. `da/tools/syrup-calculator.html`, `da.html`). For a navigation request
 * this middleware serves the matching `<path>.html` when it exists; everything
 * else (assets, locale JSON, the SPA shell fallback) is left to ServeStaticModule.
 *
 * It runs before ServeStaticModule (registered here in main.ts, before
 * `app.listen()` triggers the module's onModuleInit), which is what lets it
 * serve a route like `/da` that would otherwise be shadowed by the `da/`
 * directory holding its child routes.
 */
export function createPrerenderFallback(staticRoot: string) {
  const rootWithSep = staticRoot.endsWith(path.sep)
    ? staticRoot
    : staticRoot + path.sep;

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
    if (
      pathname === '/' ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/assets/')
    ) {
      return next();
    }

    let decoded: string;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      return next();
    }

    const candidate = path.resolve(staticRoot, '.' + decoded + '.html');
    // Guard against path traversal escaping the static root.
    if (!candidate.startsWith(rootWithSep)) return next();

    if (existsSync(candidate) && statSync(candidate).isFile()) {
      res.sendFile(candidate);
      return;
    }

    next();
  };
}
