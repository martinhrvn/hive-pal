import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
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
import {
  Github,
  BookOpen,
  Rocket,
  Mic,
  Sparkles,
  Wand2,
  Beaker,
  Bug,
  Waypoints,
  ArrowUpRight,
} from 'lucide-react';

// Structure (ids/icons) lives in code; copy comes from i18n under `marketing.*`.
const PILLAR_KEYS = ['apiary', 'inspections', 'queen', 'harvest'] as const;

const AI_ITEMS = [
  { key: 'record', icon: <Mic className="h-5 w-5" /> },
  { key: 'transcribe', icon: <Wand2 className="h-5 w-5" /> },
  { key: 'draft', icon: <Sparkles className="h-5 w-5" /> },
] as const;

const TOOL_CARDS = [
  { to: '/tools/syrup-calculator', key: 'syrup', icon: <Beaker className="h-5 w-5" /> },
  { to: '/tools/brood-timeline', key: 'brood', icon: <Bug className="h-5 w-5" /> },
  { to: '/tools/swarm-management', key: 'swarm', icon: <Waypoints className="h-5 w-5" /> },
] as const;

export function LandingPage() {
  const localize = useLocalizedPath();
  const { t } = useTranslation('common');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Hive Pal',
    description: t('marketing.landing.meta.ogDescription'),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://hivepal.app',
    author: { '@type': 'Organization', name: 'Hive Pal' },
  };

  const selfHostedItems = t('marketing.landing.run.selfHosted.items', {
    returnObjects: true,
  }) as string[];
  const hostedItems = t('marketing.landing.run.hosted.items', {
    returnObjects: true,
  }) as string[];

  return (
    <div
      className="min-h-screen w-full bg-[#FBF5EA] text-stone-900 antialiased selection:bg-amber-200 selection:text-stone-900"
      style={sans}
    >
      <PublicMeta
        title={t('marketing.landing.meta.title')}
        description={t('marketing.landing.meta.description')}
        ogTitle={t('marketing.landing.meta.ogTitle')}
        ogDescription={t('marketing.landing.meta.ogDescription')}
        ogImage="https://hivepal.app/og-image.jpg"
        twitterCard="summary_large_image"
        path="/"
        structuredData={jsonLd}
      />

      <MarketingHeader />

      {/* Hero */}
      <section className="relative flex min-h-[640px] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero3.jpg')] bg-cover bg-center" />
        {/* Stronger overlay for legibility: dark wash + radial focus behind text */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/55 via-stone-950/55 to-stone-950/75" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,12,8,0.55)_0%,rgba(15,12,8,0)_65%)]" />
        <div
          className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.95  0 0 0 0 0.9  0 0 0 0 0.75  0 0 0 0.7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />

        <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/50 bg-stone-950/60 px-3.5 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-amber-100 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            {t('marketing.landing.hero.badge')}
          </div>

          <h1
            className="mt-8 text-[clamp(2.75rem,6vw,5rem)] font-medium leading-[1.02] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.7)]"
            style={{ ...display, fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500" }}
          >
            <Trans
              t={t}
              i18nKey="marketing.landing.hero.title"
              components={{
                br: <br />,
                accent: (
                  <span
                    className="text-amber-300"
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

          <p
            className="mx-auto mt-7 max-w-2xl text-lg font-normal leading-relaxed text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]"
            style={sans}
          >
            {t('marketing.landing.hero.lede')}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="bg-amber-400 px-6 text-stone-950 shadow-[0_8px_30px_-8px_rgba(245,158,11,0.55)] hover:bg-amber-300"
            >
              <Link to="/register">
                <Rocket className="mr-2 h-4 w-4" />
                {t('marketing.landing.hero.ctaSignup')}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-amber-50/40 bg-stone-950/20 px-6 text-amber-50 backdrop-blur-sm hover:bg-amber-50 hover:text-stone-900"
            >
              <a
                href="https://github.com/martinhrvn/hive-pal"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                {t('marketing.landing.hero.ctaSelfHost')}
              </a>
            </Button>
          </div>

          <div
            className="mx-auto mt-12 flex max-w-md items-center justify-center gap-4 text-[11px] font-medium uppercase tracking-[0.22em] text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
            style={sans}
          >
            <span className="h-px flex-1 bg-white/40" />
            <span>{t('marketing.landing.hero.tagline')}</span>
            <span className="h-px flex-1 bg-white/40" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative border-b border-stone-900/10 bg-[#FBF5EA] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionLabel>{t('marketing.landing.features.label')}</SectionLabel>
              <h2
                className="mt-6 text-4xl leading-[1.05] tracking-tight text-stone-900 sm:text-5xl"
                style={{ ...display, fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500" }}
              >
                <Trans
                  t={t}
                  i18nKey="marketing.landing.features.title"
                  components={{
                    accent: <span className="text-amber-700" style={display} />,
                  }}
                />
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-stone-600">
                {t('marketing.landing.features.lede')}
              </p>
              <div className="mt-8 h-px w-16 bg-stone-900/30" />
              <p
                className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-stone-500"
                style={sans}
              >
                {t('marketing.landing.features.pillars')}
              </p>
            </div>

            <div className="lg:col-span-7">
              <dl className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2">
                {PILLAR_KEYS.map(key => (
                  <div key={key} className="group relative">
                    <div className="flex items-center gap-3">
                      <HexBullet />
                      <span className="h-px flex-1 bg-stone-900/10 transition-colors group-hover:bg-amber-700/40" />
                    </div>
                    <dt
                      className="mt-3 text-lg font-semibold text-stone-900"
                      style={sans}
                    >
                      {t(`marketing.landing.features.items.${key}.title`)}
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-stone-600">
                      {t(`marketing.landing.features.items.${key}.body`)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="relative overflow-hidden bg-[#15201E] py-24 text-amber-50 sm:py-32">
        {/* Subtle hexagon pattern */}
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
        <div
          aria-hidden="true"
          className="absolute -bottom-40 left-[-10%] h-[480px] w-[480px] rounded-full bg-emerald-500/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div
                className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-amber-200/80"
                style={sans}
              >
                <span className="h-px w-8 bg-amber-300/70" />
                <span>{t('marketing.ai.eyebrow')}</span>
              </div>
              <h2
                className="mt-6 text-4xl leading-[1.05] tracking-tight sm:text-5xl"
                style={{ ...display, fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500" }}
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

          {/* Assurance */}
          <div className="mx-auto mt-14 max-w-3xl text-center">
            <p
              className="text-base leading-relaxed text-amber-50/85 sm:text-lg"
              style={sans}
            >
              <span className="font-semibold text-amber-100">
                {t('marketing.ai.assuranceLead')}
              </span>{' '}
              {t('marketing.ai.assuranceBody')}
            </p>
            <p
              className="mt-4 text-[11px] font-medium uppercase tracking-[0.24em] text-amber-200/70"
              style={sans}
            >
              {t('marketing.ai.assuranceNote')}
            </p>
          </div>
        </div>
      </section>

      {/* Pricing / Open Source */}
      <section className="border-b border-stone-900/10 bg-[#FBF5EA] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center">
              <SectionLabel>{t('marketing.landing.run.label')}</SectionLabel>
            </div>
            <h2
              className="mt-6 text-4xl leading-[1.05] tracking-tight text-stone-900 sm:text-5xl"
              style={{ ...display, fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500" }}
            >
              <Trans
                t={t}
                i18nKey="marketing.landing.run.title"
                components={{
                  accent: <span className="text-amber-700" style={display} />,
                }}
              />
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-stone-600">
              {t('marketing.landing.run.lede')}
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Self-Hosted */}
            <div className="relative rounded-3xl border border-stone-900/10 bg-white/60 p-10 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h3
                  className="text-2xl font-semibold text-stone-900"
                  style={sans}
                >
                  {t('marketing.landing.run.selfHosted.title')}
                </h3>
                <span className="text-sm text-stone-500">
                  {t('marketing.landing.run.selfHosted.badge')}
                </span>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-stone-600">
                {t('marketing.landing.run.selfHosted.body')}
              </p>

              <ul className="mt-8 space-y-3 text-sm text-stone-700">
                {selfHostedItems.map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <HexBullet />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-10 h-px bg-stone-900/10" />
              <Button
                variant="outline"
                size="lg"
                className="mt-6 w-full border-stone-900/20 bg-transparent text-stone-900 hover:bg-stone-900 hover:text-amber-50"
                asChild
              >
                <a
                  href="https://github.com/martinhrvn/hive-pal"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  {t('marketing.landing.run.selfHosted.cta')}
                </a>
              </Button>
            </div>

            {/* Cloud Hosted */}
            <div className="relative rounded-3xl border border-amber-700/40 bg-stone-900 p-10 text-amber-50 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between">
                <h3
                  className="text-2xl font-semibold text-amber-50"
                  style={sans}
                >
                  {t('marketing.landing.run.hosted.title')}
                </h3>
                <span className="text-sm text-amber-200/80">
                  {t('marketing.landing.run.hosted.badge')}
                </span>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-amber-50/75">
                {t('marketing.landing.run.hosted.body')}
              </p>

              <ul className="mt-8 space-y-3 text-sm text-amber-50/85">
                {hostedItems.map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-3.5 w-3.5 flex-none text-amber-300"
                    >
                      <path
                        d="M12 2.5l8.66 5v9l-8.66 5-8.66-5v-9l8.66-5z"
                        fill="currentColor"
                        opacity="0.25"
                      />
                      <path
                        d="M12 2.5l8.66 5v9l-8.66 5-8.66-5v-9l8.66-5z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-10 h-px bg-amber-50/10" />
              <Button
                size="lg"
                className="mt-6 w-full bg-amber-400 text-stone-950 hover:bg-amber-300"
                asChild
              >
                <Link to="/register">
                  {t('marketing.landing.run.hosted.cta')}
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Free Tools */}
      <section className="border-b border-stone-900/10 bg-[#F4ECDB] py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <SectionLabel>{t('marketing.landing.tools.label')}</SectionLabel>
              <h2
                className="mt-6 text-4xl leading-[1.05] tracking-tight text-stone-900 sm:text-5xl"
                style={{ ...display, fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500" }}
              >
                {t('marketing.landing.tools.title')}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">
                {t('marketing.landing.tools.lede')}
              </p>
            </div>
            <Link
              to={localize('/tools')}
              className="inline-flex items-center gap-2 text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
            >
              {t('marketing.landing.tools.seeAll')}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-stone-900/10 bg-stone-900/10 sm:grid-cols-2 lg:grid-cols-3">
            {TOOL_CARDS.map(tool => (
              <Link
                key={tool.to}
                to={localize(tool.to)}
                className="group relative flex flex-col bg-[#F4ECDB] p-8 transition-colors hover:bg-[#FBF5EA]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-900/5 text-stone-900 transition-colors group-hover:bg-amber-400 group-hover:text-stone-950">
                    {tool.icon}
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-stone-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-stone-900" />
                </div>
                <h3
                  className="mt-6 text-lg font-semibold text-stone-900"
                  style={sans}
                >
                  {t(`marketing.landing.tools.items.${tool.key}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  {t(`marketing.landing.tools.items.${tool.key}.body`)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#FBF5EA] py-24 sm:py-32">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='64' viewBox='0 0 56 64'><path d='M28 2l24 14v32L28 62 4 48V16L28 2z' fill='none' stroke='%23292524' stroke-width='1'/></svg>\")",
            backgroundSize: '56px 64px',
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <img
            src="/hive-pal-logo.png"
            alt=""
            aria-hidden="true"
            className="mx-auto h-14 w-14 opacity-90"
          />
          <h2
            className="mt-8 text-4xl leading-[1.05] tracking-tight text-stone-900 sm:text-6xl"
            style={{ ...display, fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500" }}
          >
            <Trans
              t={t}
              i18nKey="marketing.landing.cta.title"
              components={{
                accent: <span className="text-amber-700" style={display} />,
              }}
            />
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-stone-600">
            {t('marketing.landing.cta.lede')}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="bg-stone-900 px-6 text-amber-50 hover:bg-stone-800"
            >
              <Link to="/register">
                {t('marketing.landing.cta.signup')}
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-stone-900/20 bg-transparent px-6 text-stone-900 hover:bg-stone-900 hover:text-amber-50"
              asChild
            >
              <a
                href="https://github.com/martinhrvn/hive-pal"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                {t('marketing.landing.cta.github')}
              </a>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
