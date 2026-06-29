import { PublicMeta } from '@/components/seo/public-meta';

interface ToolMetaProps {
  readonly title: string;
  readonly description: string;
  /** Language-neutral path, e.g. '/tools/syrup-calculator'. */
  readonly path: string;
  readonly ogTitle?: string;
  readonly ogDescription?: string;
  readonly twitterCard?: 'summary' | 'summary_large_image';
  readonly structuredData?: object;
}

/**
 * Thin wrapper around {@link PublicMeta} kept for the existing tool-page call
 * sites. Adds the language-aware canonical + hreflang alternates automatically.
 */
export function ToolMeta(props: ToolMetaProps) {
  return <PublicMeta {...props} />;
}
