type SupportedLanguage = 'en' | 'sk';

// Mapping from locale codes to supported language codes
const LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  // English variants
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'en-CA': 'en',
  'en-AU': 'en',
  
  // Slovak variants
  'sk': 'sk',
  'sk-SK': 'sk',
};

/**
 * Normalizes a language/locale code to one of the supported language codes.
 * Falls back to 'en' if the language is not supported.
 * 
 * @param languageCode - The language or locale code to normalize (e.g., 'en-US', 'es-ES')
 * @returns A supported language code ('en' | 'sk')
 */
export function normalizeLanguageCode(languageCode: string): SupportedLanguage {
  // Convert to lowercase for case-insensitive matching
  const normalizedCode = languageCode.toLowerCase();
  
  // Try exact match first
  if (LANGUAGE_MAP[normalizedCode]) {
    return LANGUAGE_MAP[normalizedCode];
  }
  
  // Try base language code (e.g., 'en' from 'en-US')
  const baseLanguage = normalizedCode.split('-')[0];
  if (LANGUAGE_MAP[baseLanguage]) {
    return LANGUAGE_MAP[baseLanguage];
  }
  
  // Fallback to English
  return 'en';
}

/**
 * Gets the list of supported language codes
 */
export function getSupportedLanguages(): SupportedLanguage[] {
  return ['en', 'sk'];
}

/**
 * Checks if a language code is supported
 */
export function isSupportedLanguage(languageCode: string): boolean {
  return getSupportedLanguages().includes(languageCode as SupportedLanguage);
}