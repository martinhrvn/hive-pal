import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import express from 'express';
import request from 'supertest';
import {
  IMMUTABLE,
  NO_STORE,
  STABLE_MEDIA_CACHE,
  noStoreUntilServed,
  staticCacheControl,
} from './static-cache-control';

const root = '/app/static';

describe('staticCacheControl', () => {
  it.each(['index.html', 'sw.js', 'registerSW.js'])(
    'never caches %s',
    (file) => {
      expect(staticCacheControl(`${root}/${file}`)).toBe(NO_STORE);
    },
  );

  it('caches hashed build output immutably, including images under /assets', () => {
    expect(staticCacheControl(`${root}/assets/root-9XwFgLyT.css`)).toBe(
      IMMUTABLE,
    );
    expect(staticCacheControl(`${root}/assets/logo-a1b2c3.png`)).toBe(
      IMMUTABLE,
    );
  });

  it.each([
    'hero-1920.jpg',
    'hero-768.webp',
    'hive-pal-logo-112.png',
    'favicon.ico',
    'vite.svg',
    'fonts/manrope-latin.woff2',
  ])('caches public media %s for a day', (file) => {
    expect(staticCacheControl(`${root}/${file}`)).toBe(STABLE_MEDIA_CACHE);
  });

  it.each([
    'locales/en/common.json',
    'site.webmanifest',
    'robots.txt',
    'sitemap.xml',
  ])('keeps the default for %s so deploys show up immediately', (file) => {
    expect(staticCacheControl(`${root}/${file}`)).toBeUndefined();
  });

  it('handles Windows path separators', () => {
    expect(staticCacheControl('C:\\app\\static\\assets\\x.js')).toBe(IMMUTABLE);
    expect(staticCacheControl('C:\\app\\static\\sw.js')).toBe(NO_STORE);
  });
});

describe('noStoreUntilServed', () => {
  let dir: string;
  let app: express.Express;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'static-'));
    await mkdir(join(dir, 'assets'));
    await writeFile(join(dir, 'assets', 'root-abc123.js'), 'export {};');
    // Same chain as production: this middleware (main.ts), then serve-static
    // with the setHeaders hook (ServeStaticModule in app.module.ts).
    app = express();
    app.use('/assets', noStoreUntilServed);
    app.use(
      express.static(dir, {
        setHeaders: (res, filePath) => {
          const cacheControl = staticCacheControl(filePath);
          if (cacheControl) res.setHeader('Cache-Control', cacheControl);
        },
      }),
    );
  });

  afterAll(() => rm(dir, { recursive: true, force: true }));

  it('lets an existing hashed asset be cached immutably', async () => {
    const res = await request(app).get('/assets/root-abc123.js').expect(200);
    expect(res.headers['cache-control']).toBe(IMMUTABLE);
  });

  it('keeps a 404 for a missing hash out of the CDN cache', async () => {
    const res = await request(app).get('/assets/root-gone99.js').expect(404);
    expect(res.headers['cache-control']).toBe(NO_STORE);
  });
});
