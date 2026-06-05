import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://hivepal.app';

interface ToolMetaProps {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly ogTitle?: string;
  readonly ogDescription?: string;
  readonly twitterCard?: 'summary' | 'summary_large_image';
  readonly structuredData?: object;
}

export function ToolMeta({
  title,
  description,
  path,
  ogTitle,
  ogDescription,
  twitterCard = 'summary',
  structuredData,
}: ToolMetaProps) {
  const url = `${SITE_URL}${path}`;
  const og = ogTitle ?? title;
  const ogDesc = ogDescription ?? description;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={og} />
      <meta property="og:description" content={ogDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:title" content={og} />
      <meta property="twitter:description" content={ogDesc} />
      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  );
}
