/**
 * Website-analytics opt-out (GDPR Art. 21 — right to object).
 *
 * The self-hosted Umami tracker reads `umami.disabled` from localStorage before
 * every send, so writing or removing this key takes effect immediately, without
 * a reload. It is the key Umami documents for opt-outs, so a future script
 * upgrade keeps honouring the visitor's choice.
 */
const UMAMI_OPT_OUT_KEY = 'umami.disabled';

export function isAnalyticsEnabled(): boolean {
  try {
    return localStorage.getItem(UMAMI_OPT_OUT_KEY) === null;
  } catch {
    return true;
  }
}

export function setAnalyticsEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.removeItem(UMAMI_OPT_OUT_KEY);
    } else {
      localStorage.setItem(UMAMI_OPT_OUT_KEY, '1');
    }
  } catch {
    // localStorage may be unavailable (private mode, quota); the preference
    // simply cannot be persisted in this browser.
  }
}
