import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePrerender } from '@/context/prerender-context';
import {
  DEFAULT_LANGUAGE,
  getAlternates,
  getCanonicalUrl,
  isPublicPathTranslated,
  isSupportedLanguage,
  normalizeLanguageCode,
  stripLanguagePrefix,
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
 * language-aware canonical URL, `hreflang` alternates (plus x-default), and
 * Open Graph / Twitter tags. React 19 hoists `<title>`, `<meta>` and `<link>`
 * into `<head>` wherever they are rendered, on the server and the client alike,
 * so no head-management library is needed. `<html lang>` is set by the root
 * layout from the URL. The route module of every page using this component
 * exports `meta = () => []` so the site-wide defaults do not duplicate these.
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
  const prerender = usePrerender();
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

  // Only advertise alternates that are real, indexable documents (reciprocal
  // with the sitemap). The prerender knows which languages this page is emitted
  // in; after a client-side navigation to another page the full set is used.
  const neutralPath = stripLanguagePrefix(path);
  const availableLangs =
    prerender && prerender.path === neutralPath
      ? new Set([...prerender.availableLangs, 'x-default'])
      : null;
  const alternates = getAlternates(path).filter(
    alt => availableLangs === null || availableLangs.has(alt.hreflang),
  );
  const og = ogTitle ?? title;
  const ogDesc = ogDescription ?? description;

  return (
    <>
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
        // JSON-LD is valid anywhere in the document; React does not hoist
        // inline scripts, so it stays where the page renders it.
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
          }}
        />
      )}
    </>
  );
}
