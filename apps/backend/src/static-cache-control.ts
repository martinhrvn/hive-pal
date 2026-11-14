// Cache-Control policy for files served by ServeStaticModule (the built
// frontend). Express's default for everything else is `public, max-age=0`,
// which makes browsers and the CDN revalidate on every request.

// Files that must never be answered from the HTTP cache, so a deployed update
// is picked up. Browsers may reuse a cached sw.js for up to 24h, which is how
// clients get stuck on the previous build: the new worker is never fetched, so
// no update is offered.
const NO_STORE_FILES = /(?:^|[\\/])(?:sw\.js|registerSW\.js|index\.html)$/;

// Hashed build output lives under /assets and is content-addressed: a given
// filename never changes its contents, so it can be cached forever. Revalidating
// these on every request is what turns a stale tab's reference to a deleted
// hash into a 404; caching them immutably keeps them usable once fetched.
const IMMUTABLE_ASSETS = /[\\/]assets[\\/]/;

// Unhashed images and fonts copied from the frontend's public/ directory
// (hero images, logos, favicons, self-hosted fonts). Their names are stable
// across deploys, so cache them for a day and refresh in the background for a
// week after that, rather than revalidating every request. Locale JSON,
// manifests and other text files keep the default so a deploy is visible
// immediately.
const STABLE_MEDIA = /\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/i;

export const NO_STORE = 'no-cache, no-store, must-revalidate';
export const IMMUTABLE = 'public, max-age=31536000, immutable';
export const STABLE_MEDIA_CACHE =
  'public, max-age=86400, stale-while-revalidate=604800';

/**
 * Returns the Cache-Control header for a static file, or `undefined` to keep
 * the serve-static default.
 */
export function staticCacheControl(filePath: string): string | undefined {
  if (NO_STORE_FILES.test(filePath)) return NO_STORE;
  if (IMMUTABLE_ASSETS.test(filePath)) return IMMUTABLE;
  if (STABLE_MEDIA.test(filePath)) return STABLE_MEDIA_CACHE;
  return undefined;
}
