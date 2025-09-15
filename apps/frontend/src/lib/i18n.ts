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
    fallbackLng: 'en',
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
      localStorage.getItem('language') || 
      navigator.language || 
      'en'
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
    ],
    defaultNS: 'common',
  });

// Add language normalization after initialization
i18n.on('languageChanged', (lng) => {
  const normalizedLng = normalizeLanguageCode(lng);
  if (lng !== normalizedLng) {
    i18n.changeLanguage(normalizedLng);
  }
});

export default i18n;
