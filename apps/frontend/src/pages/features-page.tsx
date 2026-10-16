import { useTranslation, Trans } from 'react-i18next';
import {
  ClipboardList,
  Layers,
  BarChart3,
  Users,
  ShieldCheck,
  Beaker,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PublicMeta } from '@/components/seo/public-meta';
import { useLocalizedPath } from '@/hooks/use-language-navigation';
import { SectionLabel } from '@/components/marketing/marketing-chrome';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { MarketingAiSection } from '@/components/marketing/marketing-ai-section';
import { MarketingCtaSection } from '@/components/marketing/marketing-cta-section';
import { AI_ITEM_KEYS } from '@/components/marketing/marketing-constants';
import {
  ArrowLink,
  FeatureItem,
  HexPattern,
  MarketingCtas,
  MarketingHeading,
} from '@/components/marketing/marketing-primitives';

// Group/feature structure lives in code (ids, item keys, icons); all copy comes
// from i18n under `marketing.features.groups.*` so it stays translatable.
const GROUPS = [
  {
    id: 'inspections',
    icon: ClipboardList,
    items: [
      'structured',
      'quickChecks',
      'batch',
      'scheduled',
      'photos',
      'actions',
    ],
  },
  {
    id: 'colony',
    icon: Layers,
    items: [
      'apiaries',
      'hiveConfig',
      'queens',
      'equipment',
      'qrCodes',
      'hiveScale',
    ],
  },
  {
    id: 'planning',
    icon: BarChart3,
    items: [
      'calendar',
      'reports',
      'harvest',
      'assistant',
      'mcp',
      'bulkActions',
    ],
  },
  {
    id: 'collaboration',
    icon: Users,
    items: ['sharing', 'inviteLinks', 'sharedViews'],
  },
  {
    id: 'data',
    icon: ShieldCheck,
    items: [
      'openSource',
      'selfHostable',
      'importExport',
      'privacyAI',
      'multilingual',
      'pwa',
    ],
  },
] as const;

function FeaturesHero() {
  const { t } = useTranslation('common');
  return (
    <section className="relative overflow-hidden border-b border-stone-900/10 bg-cream py-24 sm:py-32">
      <HexPattern tone="light" />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <div className="flex justify-center">
          <SectionLabel>{t('marketing.features.hero.eyebrow')}</SectionLabel>
        </div>
        <h1 className="font-marketing-display mt-6 text-[clamp(2.5rem,5.5vw,4rem)] leading-[1.04] tracking-tight text-stone-900">
          <Trans
            t={t}
            i18nKey="marketing.features.hero.title"
            components={{
              accent: (
                <span className="font-marketing-display-strong text-amber-700" />
              ),
            }}
          />
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-600">
          {t('marketing.features.hero.lede')}
        </p>
        <div className="mt-10">
          <MarketingCtas
            variant="hero"
            signupLabel={t('marketing.features.hero.ctaSignup')}
            githubLabel={t('marketing.features.hero.ctaSelfHost')}
          />
        </div>
        <div className="mx-auto mt-12 flex max-w-md items-center justify-center gap-4 text-xs font-medium uppercase tracking-[0.22em] text-stone-500">
          <span className="h-px flex-1 bg-stone-900/15" />
          <span>{t('marketing.features.hero.tagline')}</span>
          <span className="h-px flex-1 bg-stone-900/15" />
        </div>
      </div>
    </section>
  );
}

function FeatureGroup({
  group,
  shaded,
}: {
  group: (typeof GROUPS)[number];
  shaded: boolean;
}) {
  const { t } = useTranslation('common');
  const prefix = `marketing.features.groups.${group.id}`;
  const Icon = group.icon;
  return (
    <section
      id={group.id}
      className={cn(
        'border-b border-stone-900/10 py-24 sm:py-32',
        shaded ? 'bg-cream-2' : 'bg-cream',
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <SectionLabel>{t(`${prefix}.label`)}</SectionLabel>
            <MarketingHeading size="md" className="mt-6 text-stone-900">
              {t(`${prefix}.title`)}
            </MarketingHeading>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-stone-600">
              {t(`${prefix}.lede`)}
            </p>
          </div>
          <div className="hidden size-12 flex-none items-center justify-center rounded-lg bg-stone-900/5 text-stone-700 sm:flex">
            <Icon className="size-5" />
          </div>
        </div>

        <dl className="mt-16 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {group.items.map(key => (
            <FeatureItem
              key={key}
              title={t(`${prefix}.items.${key}.title`)}
              body={t(`${prefix}.items.${key}.body`)}
            />
          ))}
        </dl>
      </div>
    </section>
  );
}

function FeaturesToolsStrip() {
  const { t } = useTranslation('common');
  const localize = useLocalizedPath();
  return (
    <section className="border-b border-stone-900/10 bg-cream py-24 sm:py-32">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-end lg:px-8">
        <div className="max-w-2xl">
          <SectionLabel>{t('marketing.features.tools.label')}</SectionLabel>
          <MarketingHeading size="md" className="mt-6 text-stone-900">
            {t('marketing.features.tools.title')}
          </MarketingHeading>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-stone-600">
            {t('marketing.features.tools.lede')}
          </p>
        </div>
        <ArrowLink to={localize('/tools')}>
          <Beaker className="size-4" />
          {t('marketing.features.tools.seeAll')}
        </ArrowLink>
      </div>
    </section>
  );
}

export function FeaturesPage() {
  const { t } = useTranslation('common');

  const allFeatureNames = [
    ...AI_ITEM_KEYS.map(key => t(`marketing.ai.items.${key}.title`)),
    ...GROUPS.flatMap(group =>
      group.items.map(key =>
        t(`marketing.features.groups.${group.id}.items.${key}.title`),
      ),
    ),
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t('marketing.features.meta.title'),
    description: t('marketing.features.meta.description'),
    url: 'https://hivepal.app/features',
    about: {
      '@type': 'SoftwareApplication',
      name: 'Hive Pal',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: allFeatureNames,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: GROUPS.map((group, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: t(`marketing.features.groups.${group.id}.title`),
        description: t(`marketing.features.groups.${group.id}.lede`),
      })),
    },
  };

  return (
    <MarketingLayout>
      <PublicMeta
        title={t('marketing.features.meta.title')}
        description={t('marketing.features.meta.description')}
        ogTitle={t('marketing.features.meta.ogTitle')}
        ogDescription={t('marketing.features.meta.ogDescription')}
        ogImage="https://hivepal.app/og-image.jpg"
        twitterCard="summary_large_image"
        path="/features"
        structuredData={jsonLd}
      />
      <FeaturesHero />
      <MarketingAiSection />
      {GROUPS.map((group, index) => (
        <FeatureGroup key={group.id} group={group} shaded={index % 2 === 1} />
      ))}
      <FeaturesToolsStrip />
      <MarketingCtaSection i18nPrefix="marketing.features.cta" />
    </MarketingLayout>
  );
}
