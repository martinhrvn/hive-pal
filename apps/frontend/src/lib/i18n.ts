import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { normalizeLanguageCode } from '@/utils/language-utils';
import {
  NAMESPACES,
  getPreferredLanguage,
  readPrerenderPayload,
} from './i18n-client';

const BASE_OPTIONS = {
  fallbackLng: 'en',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
  defaultNS: 'common',
} as const;

const prerender = readPrerenderPayload();

if (prerender) {
  // Hydrating a prerendered public page. The page embeds the translation
  // bundles its server render used (page language + English fallback), so
  // i18next is initialized synchronously from them and the first client render
  // reproduces the server markup exactly. Everything else loads in the
  // background as usual.
  const embeddedNamespaces = [
    ...new Set(
      Object.values(prerender.resources).flatMap(bundle =>
        Object.keys(bundle ?? {}),
      ),
    ),
  ];
  i18n
    .use(Backend)
    .use(initReactI18next)
    .init({
      ...BASE_OPTIONS,
      lng: prerender.lang,
      ns: embeddedNamespaces,
      resources: prerender.resources,
      partialBundledLanguages: true,
      initImmediate: false,
    });
  void i18n.loadNamespaces([...NAMESPACES]);
} else {
  i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      ...BASE_OPTIONS,
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },
      // Language normalization
      lng: getPreferredLanguage(),
      ns: [...NAMESPACES],
    });
}

// Add language normalization after initialization
i18n.on('languageChanged', lng => {
  const normalizedLng = normalizeLanguageCode(lng);
  if (lng !== normalizedLng) {
    i18n.changeLanguage(normalizedLng);
  }
});

export default i18n;
