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
