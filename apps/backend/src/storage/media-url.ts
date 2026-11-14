import { createHmac, timingSafeEqual } from 'node:crypto';

/** Route that serves stored files from our own origin (StorageController). */
export const MEDIA_ROUTE = '/api/storage/files';

const HEX_SHA256 = /^[0-9a-f]{64}$/;

/** HMAC over `key:expires`, so a URL only grants access to one object until it expires. */
export function signMediaToken(
  secret: string,
  key: string,
  expires: number,
): string {
  return createHmac('sha256', secret).update(`${key}:${expires}`).digest('hex');
}

export function verifyMediaToken(
  secret: string,
  key: string,
  token: string,
  expires: number,
  nowSeconds: number,
): boolean {
  if (nowSeconds > expires || !HEX_SHA256.test(token)) {
    return false;
  }
  const expected = signMediaToken(secret, key, expires);
  return timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(expected, 'hex'),
  );
}

/** Builds `<base>/api/storage/files/<key>?token=…&expires=…`; relative when `baseUrl` is empty. */
export function buildMediaUrl(
  baseUrl: string,
  key: string,
  token: string,
  expires: number,
): string {
  const path = `${MEDIA_ROUTE}/${encodeURIComponent(key)}?token=${token}&expires=${expires}`;
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${base}${path}`;
}
