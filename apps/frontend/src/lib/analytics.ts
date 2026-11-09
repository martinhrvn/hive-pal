/**
 * Thin wrapper around the Umami tracker global.
 *
 * The tracker script is injected from `root.tsx`. When it is blocked, not yet
 * loaded, or disabled by `data-domains`, `window.umami` is undefined and the
 * call is a no-op instead of throwing.
 */
export type UmamiEventData = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface UmamiPayload {
  url?: unknown;
  referrer?: unknown;
  [key: string]: unknown;
}

interface UmamiTracker {
  track: (event: string, data?: UmamiEventData) => void;
}

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

/**
 * Umami `before-send` hook: masks secret-bearing URLs before a payload leaves
 * the browser. Password-reset tokens (`?token=…`) and public share tokens
 * (`/shared/<token>`) must never end up in the analytics database, while the
 * rest of the URL (including UTM parameters) stays intact.
 *
 * `root.tsx` serialises this function into an inline script, so it must stay
 * self-contained: no imports, no references to module-scope values.
 */
export function umamiBeforeSend(
  _type: string,
  payload: UmamiPayload | null | undefined,
): UmamiPayload | null | undefined {
  if (!payload || typeof payload !== 'object') return payload;

  const scrub = (value: unknown): unknown => {
    if (typeof value !== 'string') return value;
    return value
      .replace(/\/shared\/[^/?#]+/g, '/shared/:token')
      .replace(
        /([?&#](?:token|code|state|access_token|refresh_token|invite|key)=)[^&#]*/gi,
        '$1redacted',
      );
  };

  payload.url = scrub(payload.url);
  payload.referrer = scrub(payload.referrer);
  return payload;
}

export function trackEvent(event: string, data?: UmamiEventData): void {
  if (typeof window === 'undefined') return;
  window.umami?.track(event, data);
}
