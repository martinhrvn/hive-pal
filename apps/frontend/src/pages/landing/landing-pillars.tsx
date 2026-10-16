import { useTranslation, Trans } from 'react-i18next';
import { SectionLabel } from '@/components/marketing/marketing-chrome';
import {
  ArrowLink,
  FeatureItem,
  MarketingHeading,
} from '@/components/marketing/marketing-primitives';
import { useLocalizedPath } from '@/hooks/use-language-navigation';

const PILLAR_KEYS = ['apiary', 'inspections', 'queen', 'harvest'] as const;

export function LandingPillars() {
  const { t } = useTranslation('common');
  const localize = useLocalizedPath();
  return (
    <section className="relative border-b border-stone-900/10 bg-cream py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionLabel>{t('marketing.landing.features.label')}</SectionLabel>
            <MarketingHeading className="mt-6 text-stone-900">
              <Trans
                t={t}
                i18nKey="marketing.landing.features.title"
                components={{ accent: <span className="text-amber-700" /> }}
              />
            </MarketingHeading>
            <p className="mt-6 max-w-md text-base leading-relaxed text-stone-600">
              {t('marketing.landing.features.lede')}
            </p>
            <div className="mt-8 h-px w-16 bg-stone-900/30" />
            <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
              {t('marketing.landing.features.pillars')}
            </p>
            <ArrowLink to={localize('/features')} className="mt-6">
              {t('marketing.landing.features.seeAll')}
            </ArrowLink>
          </div>

          <dl className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:col-span-7">
            {PILLAR_KEYS.map(key => (
              <FeatureItem
                key={key}
                title={t(`marketing.landing.features.items.${key}.title`)}
                body={t(`marketing.landing.features.items.${key}.body`)}
              />
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
