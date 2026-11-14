import { ConfigService } from '@nestjs/config';
import {
  MEDIA_URL_MIN_VALIDITY_SECONDS,
  MEDIA_URL_WINDOW_SECONDS,
  MediaUrlService,
} from './media-url.service';

const KEY = 'photos/apiary-1/abc.jpg';

function service(env: Record<string, string | undefined>) {
  return new MediaUrlService({
    get: (name: string) => env[name],
  } as unknown as ConfigService);
}

function parse(url: string) {
  const parsed = new URL(url, 'https://hivepal.test');
  return {
    path: parsed.pathname,
    token: parsed.searchParams.get('token')!,
    expires: Number(parsed.searchParams.get('expires')),
  };
}

describe('MediaUrlService', () => {
  const media = service({ JWT_SECRET: 'test-secret' });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('issues a relative same-origin URL for the object', () => {
    const { downloadUrl } = media.createDownloadUrl(KEY);
    expect(downloadUrl).toMatch(
      /^\/api\/storage\/files\/photos%2Fapiary-1%2Fabc\.jpg\?token=[0-9a-f]{64}&expires=\d+$/,
    );
  });

  it('prefixes BACKEND_PUBLIC_URL when configured', () => {
    const { downloadUrl } = service({
      JWT_SECRET: 's',
      BACKEND_PUBLIC_URL: 'https://api.example.test/',
    }).createDownloadUrl(KEY);
    expect(downloadUrl).toMatch(
      /^https:\/\/api\.example\.test\/api\/storage\/files\//,
    );
  });

  it('returns the same URL for every request in one window, so it can be cached', () => {
    vi.useFakeTimers();
    const windowStart =
      1_800_000_000 - (1_800_000_000 % MEDIA_URL_WINDOW_SECONDS);
    vi.setSystemTime(windowStart * 1000 + 1000);
    const first = media.createDownloadUrl(KEY);
    vi.setSystemTime((windowStart + 3 * 60 * 60) * 1000);
    const later = media.createDownloadUrl(KEY);
    expect(later.downloadUrl).toBe(first.downloadUrl);
  });

  it('is always valid for at least the minimum validity', () => {
    vi.useFakeTimers();
    const windowEnd =
      1_800_000_000 - (1_800_000_000 % MEDIA_URL_WINDOW_SECONDS);
    // Just before a window boundary: the URL must not expire seconds later.
    vi.setSystemTime((windowEnd - 10) * 1000);
    const { expiresIn } = media.createDownloadUrl(KEY);
    expect(expiresIn).toBeGreaterThanOrEqual(MEDIA_URL_MIN_VALIDITY_SECONDS);
    expect(expiresIn).toBeLessThanOrEqual(
      MEDIA_URL_MIN_VALIDITY_SECONDS + MEDIA_URL_WINDOW_SECONDS,
    );
  });

  it('verifies its own URLs and rejects tampering', () => {
    const { token, expires } = parse(media.createDownloadUrl(KEY).downloadUrl);
    expect(media.verify(KEY, token, expires)).toBe(true);
    expect(media.verify('photos/other.jpg', token, expires)).toBe(false);
    expect(media.verify(KEY, token, expires + 1)).toBe(false);
    expect(media.verify(KEY, 'not-hex', expires)).toBe(false);
    expect(media.verify(KEY, 'ab', expires)).toBe(false);
    expect(
      service({ JWT_SECRET: 'other-secret' }).verify(KEY, token, expires),
    ).toBe(false);
  });

  it('rejects expired URLs', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_800_000_000_000);
    const { downloadUrl, expiresIn } = media.createExpiringUrl(KEY, 60);
    const { token, expires } = parse(downloadUrl);
    expect(expiresIn).toBe(60);
    expect(media.verify(KEY, token, expires)).toBe(true);
    vi.setSystemTime((expires + 1) * 1000);
    expect(media.verify(KEY, token, expires)).toBe(false);
  });

  it('never lets a response be cached past the URL expiry, and caps it at a day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_800_000_000_000);
    const now = 1_800_000_000;
    expect(media.cacheControl(now + 600)).toBe('public, max-age=600');
    expect(media.cacheControl(now + 10 * 24 * 3600)).toBe(
      'public, max-age=86400',
    );
    expect(media.cacheControl(now - 5)).toBe('public, max-age=0');
  });

  it('falls back to BETTER_AUTH_SECRET and refuses to sign without any secret', () => {
    expect(() =>
      service({ BETTER_AUTH_SECRET: 'auth' }).createDownloadUrl(KEY),
    ).not.toThrow();
    expect(() => service({}).createDownloadUrl(KEY)).toThrow(/JWT_SECRET/);
  });
});
