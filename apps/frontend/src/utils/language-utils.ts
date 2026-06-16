export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
  { code: 'sr', name: 'Српски', flag: '🇷🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
] as const;

export type SupportedLanguage = (typeof LANGUAGES)[number]['code'];

const supportedCodes = new Set<string>(LANGUAGES.map((l) => l.code));

/**
 * Normalizes a language/locale code to one of the supported language codes.
 * Falls back to 'en' if the language is not supported.
 *
 * @param languageCode - The language or locale code to normalize (e.g., 'en-US', 'es-ES')
 * @returns A supported language code
 */
export function normalizeLanguageCode(languageCode: string): SupportedLanguage {
  const normalizedCode = languageCode.toLowerCase();

  // Try exact match first
  if (supportedCodes.has(normalizedCode)) {
    return normalizedCode as SupportedLanguage;
  }

  // Try base language code (e.g., 'en' from 'en-US')
  const baseLanguage = normalizedCode.split('-')[0];
  if (supportedCodes.has(baseLanguage)) {
    return baseLanguage as SupportedLanguage;
  }

  // Fallback to English
  return 'en';
}

/**
 * Gets the list of supported language codes
 */
export function getSupportedLanguages(): SupportedLanguage[] {
  return LANGUAGES.map((l) => l.code);
}

/**
 * Checks if a language code is supported
 */
export function isSupportedLanguage(languageCode: string): boolean {
  return supportedCodes.has(languageCode);
}

/**
 * Canonical site origin used to build absolute URLs for SEO tags and the sitemap.
 */
export const SITE_URL = 'https://hivepal.app';

/**
 * Default language. Its URLs stay unprefixed and act as the canonical English
 * version, preserving existing link equity. All other languages are served under
 * a `/<lang>` prefix.
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

/**
 * Strips a leading supported-language segment from a pathname, returning the
 * language-neutral path (e.g. '/da/tools/syrup-calculator' -> '/tools/syrup-calculator',
 * '/de' -> '/'). Paths without a language prefix are returned unchanged.
 */
export function stripLanguagePrefix(pathname: string): string {
  const segments = pathname.split('/');
  // segments[0] is '' for an absolute path, segments[1] is the first real segment
  if (segments.length > 1 && isSupportedLanguage(segments[1])) {
    const rest = '/' + segments.slice(2).join('/');
    return rest === '/' ? '/' : rest.replace(/\/$/, '');
  }
  return pathname;
}

/**
 * Builds the localized path for a language-neutral path. English (the default)
 * stays unprefixed; every other language is prefixed with `/<lang>`.
 *
 * @param neutralPath - A language-neutral path beginning with '/' (e.g. '/tools')
 * @param lang - Target language code
 */
export function buildLocalizedPath(
  neutralPath: string,
  lang: string,
): string {
  const normalized = normalizeLanguageCode(lang);
  const neutral = stripLanguagePrefix(neutralPath);
  if (normalized === DEFAULT_LANGUAGE) {
    return neutral;
  }
  return neutral === '/' ? `/${normalized}` : `/${normalized}${neutral}`;
}

/**
 * Per-page marker key proving a public page has real (non-fallback) content in a
 * given language. Mirrors `ROUTE_TRANSLATION_MARKERS` in
 * `scripts/prerender-ssr.mjs`. Used to keep localized pages that only render the
 * English fallback from competing with the canonical English page in search.
 * Pages absent from this map are always treated as translated (existing behavior).
 */
const PUBLIC_PAGE_TRANSLATION_MARKERS: Record<
  string,
  { readonly ns: string; readonly key: string }
> = {
  '/': { ns: 'common', key: 'marketing.landing.hero.lede' },
  '/features': { ns: 'common', key: 'marketing.features.hero.lede' },
  '/tools': { ns: 'common', key: 'marketing.toolsIndex.intro' },
  '/tools/syrup-calculator': { ns: 'common', key: 'syrupCalculator.intro' },
  '/tools/brood-timeline': { ns: 'common', key: 'broodTimeline.intro' },
  '/tools/swarm-management': { ns: 'common', key: 'swarmManagement.intro' },
  '/tools/swarm-management/demaree': {
    ns: 'common',
    key: 'swarmManagement.demaree.description',
  },
  '/tools/liebefelder': { ns: 'common', key: 'liebefelder.intro' },
};

/**
 * Whether a public page has a genuine translation (not the English fallback or an
 * untranslated placeholder) in the given language. English is always considered
 * translated; unknown paths default to `true`. A marker value identical to the
 * English source counts as untranslated.
 */
export function isPublicPathTranslated(
  i18n: { getResource: (lng: string, ns: string, key: string) => unknown },
  neutralPath: string,
  lang: string,
): boolean {
  if (normalizeLanguageCode(lang) === DEFAULT_LANGUAGE) return true;
  const marker = PUBLIC_PAGE_TRANSLATION_MARKERS[stripLanguagePrefix(neutralPath)];
  if (!marker) return true;
  const value = i18n.getResource(lang, marker.ns, marker.key);
  if (value == null || value === '') return false;
  return value !== i18n.getResource(DEFAULT_LANGUAGE, marker.ns, marker.key);
}

export interface HreflangAlternate {
  readonly hreflang: string;
  readonly href: string;
}

/**
 * Builds the full set of `hreflang` alternate links for a language-neutral path,
 * including an `x-default` pointing at the unprefixed (English) URL. Hrefs are
 * absolute, rooted at SITE_URL.
 */
export function getAlternates(neutralPath: string): HreflangAlternate[] {
  const neutral = stripLanguagePrefix(neutralPath);
  const alternates: HreflangAlternate[] = LANGUAGES.map(({ code }) => ({
    hreflang: code,
    href: `${SITE_URL}${buildLocalizedPath(neutral, code)}`,
  }));
  alternates.push({
    hreflang: 'x-default',
    href: `${SITE_URL}${buildLocalizedPath(neutral, DEFAULT_LANGUAGE)}`,
  });
  return alternates;
}

/**
 * Builds the canonical absolute URL for a language-neutral path in a given language.
 */
export function getCanonicalUrl(neutralPath: string, lang: string): string {
  return `${SITE_URL}${buildLocalizedPath(neutralPath, lang)}`;
}
