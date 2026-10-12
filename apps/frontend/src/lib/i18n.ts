import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { normalizeLanguageCode } from '@/utils/language-utils';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // `de-informal` is a thin overlay: missing keys fall back to formal `de`,
    // then English. Every other language falls back straight to English.
    fallbackLng: { 'de-informal': ['de', 'en'], default: ['en'] },
    // Load exactly the requested language file; do not strip `de-informal`
    // down to its base `de` when fetching resources.
    load: 'currentOnly',
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    // Language normalization
    lng: normalizeLanguageCode(
      localStorage.getItem('language') || navigator.language || 'en',
    ),

    ns: [
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
    ],
    defaultNS: 'common',
  });

// Add language normalization after initialization
i18n.on('languageChanged', lng => {
  const normalizedLng = normalizeLanguageCode(lng);
  if (lng !== normalizedLng) {
    i18n.changeLanguage(normalizedLng);
  }
});

export default i18n;
