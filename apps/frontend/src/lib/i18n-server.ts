import i18next, { type i18n as I18nInstance, type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * Creates a fresh, fully-synchronous i18next instance for server-side rendering
 * during prerendering. Translations are passed in as already-loaded resources
 * (read from disk by the prerender driver) rather than fetched over HTTP, and
 * `initImmediate: false` makes init synchronous so the caller can render
 * immediately. `useSuspense: false` avoids Suspense on the server.
 */
export function createServerI18n(lang: string, resources: Resource): I18nInstance {
  const instance = i18next.createInstance();
  const namespaces = Object.keys(
    (resources[lang] as Record<string, unknown> | undefined) ??
      (resources.en as Record<string, unknown> | undefined) ??
      {},
  );

  instance.use(initReactI18next).init({
    lng: lang,
    fallbackLng: 'en',
    ns: namespaces.length > 0 ? namespaces : ['common'],
    defaultNS: 'common',
    resources,
    interpolation: { escapeValue: false },
    initImmediate: false,
    react: { useSuspense: false },
  });

  return instance;
}
