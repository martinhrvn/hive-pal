import { describe, expect, it } from 'vitest';
import { umamiBeforeSend } from './analytics';

describe('umamiBeforeSend', () => {
  it('masks public share tokens in the path', () => {
    const payload = umamiBeforeSend('pageview', {
      url: 'https://hivepal.app/shared/secret-token?x=1',
    });

    expect(payload?.url).toBe('https://hivepal.app/shared/:token?x=1');
  });

  it('redacts sensitive query parameters but keeps UTM parameters', () => {
    const payload = umamiBeforeSend('pageview', {
      url: 'https://hivepal.app/reset-password?token=secret&utm_source=email&utm_medium=newsletter',
    });

    expect(payload?.url).toBe(
      'https://hivepal.app/reset-password?token=redacted&utm_source=email&utm_medium=newsletter',
    );
  });

  it('scrubs the referrer as well', () => {
    const payload = umamiBeforeSend('event', {
      referrer: 'https://hivepal.app/reset-password?token=secret',
    });

    expect(payload?.referrer).toBe(
      'https://hivepal.app/reset-password?token=redacted',
    );
  });

  it('leaves non-string URLs untouched', () => {
    const payload = umamiBeforeSend('pageview', { url: undefined });

    expect(payload?.url).toBeUndefined();
  });

  it('passes empty payloads through', () => {
    expect(umamiBeforeSend('pageview', null)).toBeNull();
    expect(umamiBeforeSend('pageview', undefined)).toBeUndefined();
  });
});
