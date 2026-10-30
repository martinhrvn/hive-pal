import { useEffect } from 'react';
import { Outlet, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { NotFoundPage } from '@/pages/not-found-page';
import {
  isPublicLanguage,
  normalizeLanguageCode,
  toPublicLanguage,
} from '@/utils/language-utils';

/**
 * Layout for the language-prefixed public routes (`/:lang/...`). It keeps the
 * active i18next language in sync with the URL segment so a direct visit to
 * `/da/tools/...` renders in Danish, and reflects the language on the
 * `<html lang>` attribute. The user's explicit URL choice is persisted so it
 * carries over into the (language-neutral) app. A register variant of the URL
 * language (e.g. `de-informal` on a `/de` page) is left untouched, since it
 * shares the canonical language's URLs.
 *
 * The `/:lang` segment also catches any unknown single-segment path (static
 * routes rank higher); unsupported codes render the 404 page.
 */
export function LangLayout() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  const supported = !!lang && isPublicLanguage(lang);

  useEffect(() => {
    if (!lang || !supported) return;
    const normalized = normalizeLanguageCode(lang);
    const current = normalizeLanguageCode(i18n.language);
    const effective =
      toPublicLanguage(current) === normalized ? current : normalized;
    if (i18n.language !== effective) {
      void i18n.changeLanguage(effective);
    }
    document.documentElement.lang = normalized;
    try {
      localStorage.setItem('language', effective);
    } catch {
      // localStorage may be unavailable (private mode) — ignore.
    }
  }, [lang, supported, i18n]);

  if (!supported) {
    return <NotFoundPage />;
  }

  return <Outlet />;
}
