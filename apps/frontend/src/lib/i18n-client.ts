import { useEffect } from 'react';
import { getI18n } from 'react-i18next';
import {
  PRERENDER_GLOBAL,
  type PrerenderPayload,
} from '@/routes/public-routes';
import {
  isSupportedLanguage,
  normalizeLanguageCode,
  type SupportedLanguage,
} from '@/utils/language-utils';

/** Every translation namespace the app uses. */
export const NAMESPACES = [
  'common',
  'auth',
  'hive',
  'inspection',
  'apiary',
  'queen',
  'admin',
  'onboarding',
  'privacy',
  'todo',
  'hivescale',
  'ai',
] as const;

/**
 * The payload a prerendered public page embeds for hydration (see
 * entry.server.tsx), or `null` for the SPA shell, in dev, and on the server.
 */
export function readPrerenderPayload(): PrerenderPayload | null {
  if (typeof window === 'undefined') return null;
  return window[PRERENDER_GLOBAL] ?? null;
}

/** The language the visitor chose earlier (or their browser's), normalized. */
export function getPreferredLanguage(): SupportedLanguage {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem('language');
  } catch {
    // localStorage may be unavailable (private mode) — fall back to the browser.
  }
  return normalizeLanguageCode(stored || navigator.language || 'en');
}

/** The supported language a pathname is prefixed with, if any. */
export function languageFromPathname(pathname: string): string | null {
  const first = pathname.split('/')[1];
  return first && isSupportedLanguage(first) ? first : null;
}

/**
 * A prerendered page hydrates in the language it was rendered in: the URL's
 * language for `/:lang/...` pages and English for the unprefixed (canonical)
 * ones, whatever the visitor's stored preference. Once hydrated, an unprefixed
 * page switches to the visitor's preferred language, which is what the app
 * showed before prerendering existed. Prefixed pages keep the URL's language
 * (LangLayout persists that choice).
 */
export function useRestorePreferredLanguage(): void {
  useEffect(() => {
    if (!readPrerenderPayload()) return;
    if (languageFromPathname(window.location.pathname)) return;
    const i18n = getI18n();
    const preferred = getPreferredLanguage();
    if (i18n && i18n.language !== preferred) {
      void i18n.changeLanguage(preferred);
    }
  }, []);
}
