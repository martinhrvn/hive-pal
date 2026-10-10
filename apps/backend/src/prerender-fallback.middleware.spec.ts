import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import type { Request, Response } from 'express';
import {
  PRERENDER_DIR,
  createPrerenderFallback,
} from './prerender-fallback.middleware';

describe('createPrerenderFallback', () => {
  let staticRoot: string;
  let middleware: ReturnType<typeof createPrerenderFallback>;

  const writePage = (urlPath: string) => {
    const dir = path.join(
      staticRoot,
      PRERENDER_DIR,
      urlPath.replace(/^\//, ''),
    );
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'index.html'), `<html>${urlPath}</html>`);
  };

  const run = (
    url: string,
    { method = 'GET', cookie }: { method?: string; cookie?: string } = {},
  ) => {
    const req = {
      method,
      path: url,
      headers: cookie ? { cookie } : {},
    } as unknown as Request;
    const sendFile = vi.fn();
    const res = { sendFile } as unknown as Response;
    const next = vi.fn();
    middleware(req, res, next);
    return {
      sentFile: sendFile.mock.calls[0]?.[0] as string | undefined,
      next,
    };
  };

  const prerendered = (urlPath: string) =>
    path.join(
      staticRoot,
      PRERENDER_DIR,
      urlPath.replace(/^\//, ''),
      'index.html',
    );

  beforeAll(() => {
    staticRoot = mkdtempSync(path.join(tmpdir(), 'hive-pal-static-'));
    // The SPA shell, served by ServeStaticModule, must never be picked here.
    writeFileSync(path.join(staticRoot, 'index.html'), '<html>shell</html>');
    writePage('/');
    writePage('/features');
    writePage('/da');
    writePage('/da/tools/syrup-calculator');
  });

  afterAll(() => {
    rmSync(staticRoot, { recursive: true, force: true });
  });

  beforeEach(() => {
    middleware = createPrerenderFallback(staticRoot);
  });

  it('serves the prerendered landing page for /', () => {
    const { sentFile, next } = run('/');
    expect(sentFile).toBe(prerendered('/'));
    expect(next).not.toHaveBeenCalled();
  });

  it('serves prerendered pages with and without a trailing slash', () => {
    expect(run('/features').sentFile).toBe(prerendered('/features'));
    expect(run('/features/').sentFile).toBe(prerendered('/features'));
    expect(run('/da').sentFile).toBe(prerendered('/da'));
    expect(run('/da/tools/syrup-calculator').sentFile).toBe(
      prerendered('/da/tools/syrup-calculator'),
    );
  });

  it('decodes percent-encoded paths', () => {
    expect(run('/da/tools/syrup%2Dcalculator').sentFile).toBe(
      prerendered('/da/tools/syrup-calculator'),
    );
  });

  it('falls through for app routes, so they get the SPA shell', () => {
    for (const url of ['/hives', '/login', '/tools/unknown', '/fr/features']) {
      const { sentFile, next } = run(url);
      expect(sentFile).toBeUndefined();
      expect(next).toHaveBeenCalledOnce();
    }
  });

  it('falls through for authenticated visitors, who get the SPA shell', () => {
    const { sentFile, next } = run('/', {
      cookie: 'better-auth.session_token=abc; other=1',
    });
    expect(sentFile).toBeUndefined();
    expect(next).toHaveBeenCalledOnce();
  });

  it('ignores API, asset and non-GET requests', () => {
    expect(run('/api/features').next).toHaveBeenCalledOnce();
    expect(run('/assets/features').next).toHaveBeenCalledOnce();
    expect(run('/features', { method: 'POST' }).next).toHaveBeenCalledOnce();
    expect(run('/features', { method: 'HEAD' }).sentFile).toBe(
      prerendered('/features'),
    );
  });

  it('never escapes the prerender directory', () => {
    for (const url of ['/..', '/../index.html', '/%2e%2e/%2e%2e', '/%ZZ']) {
      const { sentFile, next } = run(url);
      expect(sentFile).toBeUndefined();
      expect(next).toHaveBeenCalledOnce();
    }
  });
});
