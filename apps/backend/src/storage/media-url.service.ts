import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildMediaUrl, signMediaToken, verifyMediaToken } from './media-url';

// Signed media URLs expire at the end of a fixed window instead of a fixed
// time after they are issued. Every request inside the same window gets the
// same URL for an object, so browsers and the CDN can cache it; a fresh
// signature per request would make every URL unique and nothing would hit.
export const MEDIA_URL_WINDOW_SECONDS = 6 * 60 * 60;
// A URL is always valid for at least this long after it is issued.
export const MEDIA_URL_MIN_VALIDITY_SECONDS = 60 * 60;
// Upper bound for how long a response may be cached, whatever the expiry.
const MEDIA_MAX_CACHE_SECONDS = 24 * 60 * 60;

export interface MediaDownloadUrl {
  downloadUrl: string;
  expiresIn: number;
}

/**
 * Issues and verifies signed URLs for stored files that browsers load from our
 * own origin (photos, documents, audio playback), served by StorageController.
 * Server-side consumers that fetch files themselves (AI transcription, worker
 * jobs) keep using StorageService.generateDownloadUrl.
 */
@Injectable()
export class MediaUrlService {
  constructor(private readonly configService: ConfigService) {}

  /** Cacheable URL for browsers: stable for every request in the same window. */
  createDownloadUrl(key: string): MediaDownloadUrl {
    const now = nowSeconds();
    const expires =
      Math.ceil(
        (now + MEDIA_URL_MIN_VALIDITY_SECONDS) / MEDIA_URL_WINDOW_SECONDS,
      ) * MEDIA_URL_WINDOW_SECONDS;
    return this.urlFor(key, expires, now);
  }

  /** URL that expires exactly `expiresIn` seconds from now (local storage's server-side downloads). */
  createExpiringUrl(key: string, expiresIn: number): MediaDownloadUrl {
    const now = nowSeconds();
    return this.urlFor(key, now + expiresIn, now);
  }

  verify(key: string, token: string, expires: number): boolean {
    return verifyMediaToken(this.secret(), key, token, expires, nowSeconds());
  }

  /**
   * Cache headers for a verified URL. The URL itself is the access check, so
   * shared caches may keep the response, but never past the URL's expiry.
   */
  cacheControl(expires: number): string {
    const maxAge = Math.min(
      Math.max(expires - nowSeconds(), 0),
      MEDIA_MAX_CACHE_SECONDS,
    );
    return `public, max-age=${maxAge}`;
  }

  private urlFor(key: string, expires: number, now: number): MediaDownloadUrl {
    const token = signMediaToken(this.secret(), key, expires);
    const baseUrl = this.configService.get<string>('BACKEND_PUBLIC_URL') ?? '';
    return {
      downloadUrl: buildMediaUrl(baseUrl, key, token, expires),
      expiresIn: expires - now,
    };
  }

  private secret(): string {
    const secret =
      this.configService.get<string>('JWT_SECRET') ||
      this.configService.get<string>('BETTER_AUTH_SECRET');
    if (!secret) {
      throw new Error(
        'Signed media URLs need JWT_SECRET (or BETTER_AUTH_SECRET) to be set.',
      );
    }
    return secret;
  }
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
