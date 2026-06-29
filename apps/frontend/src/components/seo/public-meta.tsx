import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_LANGUAGE,
  getAlternates,
  getCanonicalUrl,
  isPublicPathTranslated,
  isSupportedLanguage,
  normalizeLanguageCode,
} from '@/utils/language-utils';

interface PublicMetaProps {
  readonly title: string;
  readonly description: string;
  /** Language-neutral path of the page, e.g. '/tools/syrup-calculator' or '/'. */
  readonly path: string;
  readonly ogTitle?: string;
  readonly ogDescription?: string;
  readonly ogImage?: string;
  readonly twitterCard?: 'summary' | 'summary_large_image';
  readonly structuredData?: object;
}

/**
 * SEO head for public, multilingual pages. Emits title/description, a
 * language-aware canonical URL, a full set of `hreflang` alternates (plus
 * x-default), `<html lang>`, and Open Graph / Twitter tags.
 *
 * The canonical for English is the unprefixed URL; other languages canonicalize
 * to their `/<lang>` URL. This is what makes the prerendered, language-prefixed
 * pages indexable as distinct localized documents.
 */
export function PublicMeta({
  title,
  description,
  path,
  ogTitle,
  ogDescription,
  ogImage,
  twitterCard = 'summary',
  structuredData,
}: PublicMetaProps) {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  const currentLang =
    lang && isSupportedLanguage(lang)
      ? lang
      : normalizeLanguageCode(i18n.language);

  // A localized page that only renders the English fallback is a near-duplicate of
  // the canonical English page; point its canonical at English so search engines
  // consolidate the signals instead of flagging "crawled, currently not indexed".
  const canonicalLang = isPublicPathTranslated(i18n, path, currentLang)
    ? currentLang
    : DEFAULT_LANGUAGE;
  const canonical = getCanonicalUrl(path, canonicalLang);
  const alternates = getAlternates(path);
  const og = ogTitle ?? title;
  const ogDesc = ogDescription ?? description;

  return (
    <Helmet>
      <html lang={currentLang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {alternates.map(alt => (
        <link
          key={alt.hreflang}
          rel="alternate"
          hrefLang={alt.hreflang}
          href={alt.href}
        />
      ))}
      <meta property="og:title" content={og} />
      <meta property="og:description" content={ogDesc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={currentLang} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:title" content={og} />
      <meta property="twitter:description" content={ogDesc} />
      {ogImage && <meta property="twitter:image" content={ogImage} />}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
