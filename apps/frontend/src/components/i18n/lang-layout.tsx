import { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { normalizeLanguageCode } from '@/utils/language-utils';

/**
 * Layout for the language-prefixed public routes (`/:lang/...`). It keeps the
 * active i18next language in sync with the URL segment so a direct visit to
 * `/da/tools/...` renders in Danish, and reflects the language on the
 * `<html lang>` attribute. The user's explicit URL choice is persisted so it
 * carries over into the (language-neutral) app.
 */
export function LangLayout() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!lang) return;
    const normalized = normalizeLanguageCode(lang);
    if (i18n.language !== normalized) {
      void i18n.changeLanguage(normalized);
    }
    document.documentElement.lang = normalized;
    try {
      localStorage.setItem('language', normalized);
    } catch {
      // localStorage may be unavailable (private mode / prerender) — ignore.
    }
  }, [lang, i18n]);

  return <Outlet />;
}
