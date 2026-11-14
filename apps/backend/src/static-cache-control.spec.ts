import {
  IMMUTABLE,
  NO_STORE,
  STABLE_MEDIA_CACHE,
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
