import { useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  buildLocalizedPath,
  isSupportedLanguage,
  normalizeLanguageCode,
  stripLanguagePrefix,
} from '@/utils/language-utils';

// Neutral path prefixes whose pages are public and therefore get
// language-prefixed URLs. The bare landing path ('/') is intentionally excluded
// because for logged-in users it is the dashboard, not the public landing page.
const PUBLIC_PATH_PREFIXES = ['/tools', '/releases', '/privacy-policy'];

/**
 * Whether the given pathname belongs to a public page that supports
 * language-prefixed URLs. True when the path already carries a supported
 * language prefix, or its neutral form matches a public route.
 */
export function isLanguageNavigablePath(pathname: string): boolean {
  const segments = pathname.split('/');
  if (segments.length > 1 && isSupportedLanguage(segments[1])) {
    return true;
  }
  const neutral = stripLanguagePrefix(pathname);
  return PUBLIC_PATH_PREFIXES.some(
    prefix => neutral === prefix || neutral.startsWith(`${prefix}/`),
  );
}

/**
 * Returns a function that localizes a language-neutral path to the currently
 * active language. The active language is the `/:lang` route param when present,
 * otherwise the current i18next language. On unprefixed pages of the default
 * language this returns the neutral path unchanged.
 */
export function useLocalizedPath(): (neutralPath: string) => string {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  const currentLang =
    lang && isSupportedLanguage(lang)
      ? lang
      : normalizeLanguageCode(i18n.language);

  return useCallback(
    (neutralPath: string) => buildLocalizedPath(neutralPath, currentLang),
    [currentLang],
  );
}

/**
 * Returns `switchLanguage(code)`. On public pages it navigates to the localized
 * URL (so the prefixed URLs become the canonical browsing path and SEO signals
 * consolidate there). On app/protected pages it only changes the i18next
 * language and persists the choice — URLs stay language-neutral, as before.
 */
export function useLanguageNavigation(): (code: string) => void {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (code: string) => {
      const normalized = normalizeLanguageCode(code);

      void i18n.changeLanguage(normalized);
      try {
        localStorage.setItem('language', normalized);
      } catch {
        // localStorage may be unavailable — ignore.
      }

      if (isLanguageNavigablePath(location.pathname)) {
        const neutral = stripLanguagePrefix(location.pathname);
        const target = buildLocalizedPath(neutral, normalized);
        if (target !== location.pathname) {
          navigate(`${target}${location.search}${location.hash}`);
        }
      }
    },
    [i18n, navigate, location.pathname, location.search, location.hash],
  );
}
