import { Beaker, Bug, Waypoints } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ToolMeta, ToolPageHeader } from '@/components/tool-page';
import { useLocalizedPath } from '@/hooks/use-language-navigation';

// Tool structure (route + icon + i18n key) lives in code; copy comes from i18n
// under `marketing.toolsIndex.*`.
const TOOLS = [
  { to: '/tools/syrup-calculator', key: 'syrup', icon: Beaker },
  { to: '/tools/brood-timeline', key: 'brood', icon: Bug },
  { to: '/tools/swarm-management', key: 'swarm', icon: Waypoints },
] as const;

export function ToolsIndexPage() {
  const localize = useLocalizedPath();
  const { t } = useTranslation('common');

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('marketing.toolsIndex.meta.title'),
    url: 'https://hivepal.app/tools',
    description: t('marketing.toolsIndex.meta.description'),
    isAccessibleForFree: true,
    publisher: {
      '@type': 'Organization',
      name: 'Hive Pal',
      url: 'https://hivepal.app',
    },
    hasPart: TOOLS.map(tool => ({
      '@type': 'WebPage',
      name: t(`marketing.toolsIndex.items.${tool.key}.title`),
      url: `https://hivepal.app${tool.to}`,
      description: t(`marketing.toolsIndex.items.${tool.key}.body`),
    })),
  };

  // The tools index has no aside, so it spans the full width rather than the
  // 2/3 MainContent column used by the tool detail pages.
  return (
    <>
      <ToolMeta
        title={t('marketing.toolsIndex.meta.title')}
        description={t('marketing.toolsIndex.meta.description')}
        ogDescription={t('marketing.toolsIndex.meta.ogDescription')}
        path="/tools"
        structuredData={structuredData}
      />

      <ToolPageHeader
        eyebrow={t('marketing.toolsIndex.eyebrow')}
        title={t('marketing.toolsIndex.title')}
        intro={t('marketing.toolsIndex.intro')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map(({ to, icon: Icon, key }) => (
          <Link
            key={to}
            to={localize(to)}
            className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-amber-300 hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Icon className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-foreground group-hover:text-amber-700">
                {t(`marketing.toolsIndex.items.${key}.title`)}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {t(`marketing.toolsIndex.items.${key}.body`)}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
