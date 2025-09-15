type SupportedLanguage = 'en' | 'es' | 'fr' | 'de';

// Mapping from locale codes to supported language codes
const LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  // English variants
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'en-CA': 'en',
  'en-AU': 'en',
  
  // Spanish variants
  'es': 'es',
  'es-ES': 'es',
  'es-MX': 'es',
  'es-AR': 'es',
  'es-CO': 'es',
  'es-PE': 'es',
  'es-VE': 'es',
  'es-CL': 'es',
  'es-EC': 'es',
  'es-UY': 'es',
  'es-PY': 'es',
  'es-BO': 'es',
  'es-CR': 'es',
  'es-PA': 'es',
  'es-GT': 'es',
  'es-HN': 'es',
  'es-SV': 'es',
  'es-NI': 'es',
  'es-DO': 'es',
  'es-PR': 'es',
  
  // French variants
  'fr': 'fr',
  'fr-FR': 'fr',
  'fr-CA': 'fr',
  'fr-BE': 'fr',
  'fr-CH': 'fr',
  
  // German variants
  'de': 'de',
  'de-DE': 'de',
  'de-AT': 'de',
  'de-CH': 'de',
};

/**
 * Normalizes a language/locale code to one of the supported language codes.
 * Falls back to 'en' if the language is not supported.
 * 
 * @param languageCode - The language or locale code to normalize (e.g., 'en-US', 'es-ES')
 * @returns A supported language code ('en' | 'es' | 'fr' | 'de')
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
  return ['en', 'es', 'fr', 'de'];
}

/**
 * Checks if a language code is supported
 */
export function isSupportedLanguage(languageCode: string): boolean {
  return getSupportedLanguages().includes(languageCode as SupportedLanguage);
}