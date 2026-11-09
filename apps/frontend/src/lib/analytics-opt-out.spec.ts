import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isAnalyticsEnabled, setAnalyticsEnabled } from './analytics-opt-out';

const UMAMI_OPT_OUT_KEY = 'umami.disabled';

describe('analytics opt-out', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('is enabled by default', () => {
    expect(isAnalyticsEnabled()).toBe(true);
  });

  it('persists an opt-out under the key Umami reads', () => {
    setAnalyticsEnabled(false);

    expect(localStorage.getItem(UMAMI_OPT_OUT_KEY)).toBe('1');
    expect(isAnalyticsEnabled()).toBe(false);
  });

  it('removes the opt-out when analytics is turned back on', () => {
    setAnalyticsEnabled(false);

    setAnalyticsEnabled(true);

    expect(localStorage.getItem(UMAMI_OPT_OUT_KEY)).toBeNull();
    expect(isAnalyticsEnabled()).toBe(true);
  });

  it('fails open when localStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(isAnalyticsEnabled()).toBe(true);
    expect(() => setAnalyticsEnabled(false)).not.toThrow();
  });
});
