import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import {
  Mic,
  Wand2,
  Sparkles,
  ClipboardList,
  Layers,
  BarChart3,
  Users,
  ShieldCheck,
  Beaker,
  ArrowUpRight,
  Rocket,
  Github,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicMeta } from '@/components/seo/public-meta';
import { useLocalizedPath } from '@/hooks/use-language-navigation';
import { display, sans } from '@/components/marketing/marketing-styles';
import {
  HexBullet,
  SectionLabel,
  MarketingHeader,
  MarketingFooter,
} from '@/components/marketing/marketing-chrome';

// Group/feature structure lives in code (ids, item keys, icons); all copy comes
// from i18n under `marketing.features.groups.*` so it stays translatable.
const GROUPS = [
  {
    id: 'inspections',
    icon: <ClipboardList className="h-5 w-5" />,
    items: ['structured', 'quickChecks', 'batch', 'scheduled', 'photos', 'actions'],
  },
  {
    id: 'colony',
    icon: <Layers className="h-5 w-5" />,
    items: ['apiaries', 'hiveConfig', 'queens', 'equipment', 'qrCodes', 'hiveScale'],
  },
  {
    id: 'planning',
    icon: <BarChart3 className="h-5 w-5" />,
    items: ['calendar', 'reports', 'harvest', 'assistant', 'bulkActions'],
  },
  {
    id: 'collaboration',
    icon: <Users className="h-5 w-5" />,
    items: ['sharing', 'inviteLinks', 'sharedViews'],
  },
  {
    id: 'data',
    icon: <ShieldCheck className="h-5 w-5" />,
    items: ['openSource', 'selfHostable', 'importExport', 'privacyAI', 'multilingual', 'pwa'],
  },
] as const;

// AI is the headline capability — its own emphasised dark section.
const AI_ITEMS = [
  { key: 'record', icon: <Mic className="h-5 w-5" /> },
  { key: 'transcribe', icon: <Wand2 className="h-5 w-5" /> },
  { key: 'draft', icon: <Sparkles className="h-5 w-5" /> },
] as const;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-amber-200/80"
      style={sans}
    >
      <span className="h-px w-8 bg-amber-300/70" />
      <span>{children}</span>
    </div>
  );
}

export function FeaturesPage() {
  const localize = useLocalizedPath();
  const { t } = useTranslation('common');

  const allFeatureNames = [
    ...AI_ITEMS.map(item => t(`marketing.ai.items.${item.key}.title`)),
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
    <div
      className="min-h-screen w-full bg-[#FBF5EA] text-stone-900 antialiased selection:bg-amber-200 selection:text-stone-900"
      style={sans}
    >
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

      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-stone-900/10 bg-[#FBF5EA] py-20 sm:py-28">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='64' viewBox='0 0 56 64'><path d='M28 2l24 14v32L28 62 4 48V16L28 2z' fill='none' stroke='%23292524' stroke-width='1'/></svg>\")",
            backgroundSize: '56px 64px',
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="flex justify-center">
            <SectionLabel>{t('marketing.features.hero.eyebrow')}</SectionLabel>
          </div>
          <h1
            className="mt-6 text-[clamp(2.5rem,5.5vw,4rem)] font-medium leading-[1.04] tracking-tight text-stone-900"
            style={{
              ...display,
              fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500",
            }}
          >
            <Trans
              t={t}
              i18nKey="marketing.features.hero.title"
              components={{
                accent: (
                  <span
                    className="text-amber-700"
                    style={{
                      ...display,
                      fontVariationSettings:
                        "'opsz' 96, 'wdth' 100, 'wght' 600",
                    }}
                  />
                ),
              }}
            />
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-600">
            {t('marketing.features.hero.lede')}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="bg-stone-900 px-6 text-amber-50 hover:bg-stone-800"
            >
              <Link to="/register">
                <Rocket className="mr-2 h-4 w-4" />
                {t('marketing.features.hero.ctaSignup')}
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-stone-900/20 bg-transparent px-6 text-stone-900 hover:bg-stone-900 hover:text-amber-50"
            >
              <a
                href="https://github.com/martinhrvn/hive-pal"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                {t('marketing.features.hero.ctaSelfHost')}
              </a>
            </Button>
          </div>
          <div
            className="mx-auto mt-12 flex max-w-md items-center justify-center gap-4 text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500"
            style={sans}
          >
            <span className="h-px flex-1 bg-stone-900/15" />
            <span>{t('marketing.features.hero.tagline')}</span>
            <span className="h-px flex-1 bg-stone-900/15" />
          </div>
        </div>
      </section>

      {/* AI — headline capability, emphasised dark section */}
      <section className="relative overflow-hidden bg-[#15201E] py-24 text-amber-50 sm:py-28">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='64' viewBox='0 0 56 64'><path d='M28 2l24 14v32L28 62 4 48V16L28 2z' fill='none' stroke='%23E8C76A' stroke-width='1'/></svg>\")",
            backgroundSize: '56px 64px',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -top-32 right-[-10%] h-[420px] w-[420px] rounded-full bg-amber-500/12 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Eyebrow>{t('marketing.ai.eyebrow')}</Eyebrow>
              <h2
                className="mt-6 text-4xl leading-[1.05] tracking-tight sm:text-5xl"
                style={{
                  ...display,
                  fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500",
                }}
              >
                <Trans
                  t={t}
                  i18nKey="marketing.ai.title"
                  components={{
                    br: <br />,
                    accent: <span className="text-amber-200" style={display} />,
                  }}
                />
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="text-base leading-relaxed text-amber-50/75">
                {t('marketing.ai.lede')}
              </p>
            </div>
          </div>

          <div className="mx-auto mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-amber-50/10 lg:grid-cols-3">
            {AI_ITEMS.map(item => (
              <div
                key={item.key}
                className="group relative bg-[#15201E] p-8 transition-colors hover:bg-[#1a2826]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/15 text-amber-200">
                  {item.icon}
                </div>
                <h3
                  className="mt-6 text-lg font-semibold text-amber-50"
                  style={sans}
                >
                  {t(`marketing.ai.items.${item.key}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-amber-50/70">
                  {t(`marketing.ai.items.${item.key}.body`)}
                </p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-14 max-w-3xl text-center">
            <p
              className="text-base leading-relaxed text-amber-50/85"
              style={sans}
            >
              <span className="font-semibold text-amber-100">
                {t('marketing.ai.assuranceLead')}
              </span>{' '}
              {t('marketing.ai.assuranceBody')}
            </p>
          </div>
        </div>
      </section>

      {/* Feature groups */}
      {GROUPS.map((group, index) => (
        <section
          key={group.id}
          id={group.id}
          className={`border-b border-stone-900/10 py-20 sm:py-24 ${
            index % 2 === 0 ? 'bg-[#FBF5EA]' : 'bg-[#F4ECDB]'
          }`}
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <SectionLabel>
                  {t(`marketing.features.groups.${group.id}.label`)}
                </SectionLabel>
                <h2
                  className="mt-5 text-3xl leading-[1.06] tracking-tight text-stone-900 sm:text-4xl"
                  style={{
                    ...display,
                    fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500",
                  }}
                >
                  {t(`marketing.features.groups.${group.id}.title`)}
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">
                  {t(`marketing.features.groups.${group.id}.lede`)}
                </p>
              </div>
              <div className="hidden h-12 w-12 flex-none items-center justify-center rounded-xl bg-stone-900/5 text-stone-700 sm:flex">
                {group.icon}
              </div>
            </div>

            <dl className="mt-14 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map(key => (
                <div key={key} className="group relative">
                  <div className="flex items-center gap-3">
                    <HexBullet />
                    <span className="h-px flex-1 bg-stone-900/10 transition-colors group-hover:bg-amber-700/40" />
                  </div>
                  <dt
                    className="mt-3 text-lg font-semibold text-stone-900"
                    style={sans}
                  >
                    {t(`marketing.features.groups.${group.id}.items.${key}.title`)}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-stone-600">
                    {t(`marketing.features.groups.${group.id}.items.${key}.body`)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ))}

      {/* Free tools strip */}
      <section className="border-b border-stone-900/10 bg-[#FBF5EA] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <SectionLabel>{t('marketing.features.tools.label')}</SectionLabel>
              <h2
                className="mt-5 text-3xl leading-[1.06] tracking-tight text-stone-900 sm:text-4xl"
                style={{
                  ...display,
                  fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500",
                }}
              >
                {t('marketing.features.tools.title')}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">
                {t('marketing.features.tools.lede')}
              </p>
            </div>
            <Link
              to={localize('/tools')}
              className="inline-flex items-center gap-2 text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
            >
              <Beaker className="h-4 w-4" />
              {t('marketing.features.tools.seeAll')}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#FBF5EA] py-24 sm:py-28">
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <img
            src="/hive-pal-logo.png"
            alt=""
            aria-hidden="true"
            className="mx-auto h-14 w-14 opacity-90"
          />
          <h2
            className="mt-8 text-4xl leading-[1.05] tracking-tight text-stone-900 sm:text-5xl"
            style={{
              ...display,
              fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500",
            }}
          >
            <Trans
              t={t}
              i18nKey="marketing.features.cta.title"
              components={{
                accent: <span className="text-amber-700" style={display} />,
              }}
            />
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-stone-600">
            {t('marketing.features.cta.lede')}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="bg-stone-900 px-6 text-amber-50 hover:bg-stone-800"
            >
              <Link to="/register">
                {t('marketing.features.cta.signup')}
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-stone-900/20 bg-transparent px-6 text-stone-900 hover:bg-stone-900 hover:text-amber-50"
            >
              <a
                href="https://github.com/martinhrvn/hive-pal"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                {t('marketing.features.cta.github')}
              </a>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
