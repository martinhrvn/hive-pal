import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpRight,
  Beaker,
  Bug,
  Microscope,
  ShieldCheck,
  Waypoints,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionLabel } from '@/components/marketing/marketing-chrome';
import {
  ArrowLink,
  MarketingHeading,
} from '@/components/marketing/marketing-primitives';
import { MARKETING_FOCUS } from '@/components/marketing/marketing-constants';
import { useLocalizedPath } from '@/hooks/use-language-navigation';

const TOOL_CARDS = [
  { to: '/tools/syrup-calculator', key: 'syrup', icon: Beaker },
  { to: '/tools/brood-timeline', key: 'brood', icon: Bug },
  { to: '/tools/swarm-management', key: 'swarm', icon: Waypoints },
  { to: '/tools/liebefelder', key: 'liebefelder', icon: Microscope },
  { to: '/tools/varroa-management', key: 'varroa', icon: ShieldCheck },
] as const;

export function LandingTools() {
  const { t } = useTranslation('common');
  const localize = useLocalizedPath();
  return (
    <section className="border-b border-stone-900/10 bg-cream-2 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <SectionLabel>{t('marketing.landing.tools.label')}</SectionLabel>
            <MarketingHeading className="mt-6 text-stone-900">
              {t('marketing.landing.tools.title')}
            </MarketingHeading>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-stone-600">
              {t('marketing.landing.tools.lede')}
            </p>
          </div>
          <ArrowLink to={localize('/tools')}>
            {t('marketing.landing.tools.seeAll')}
          </ArrowLink>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-stone-900/10 bg-stone-900/10 sm:grid-cols-2 lg:grid-cols-3">
          {TOOL_CARDS.map(({ to, key, icon: Icon }) => (
            <Link
              key={to}
              to={localize(to)}
              className={cn(
                MARKETING_FOCUS,
                // 5 cards: the last one fills the leftover cells of a 2- or 3-column row
                'group relative flex flex-col rounded-none bg-cream-2 p-8 transition-colors hover:bg-cream focus-visible:ring-inset sm:last:col-span-2',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-stone-900/5 text-stone-900 transition-colors group-hover:bg-amber-400 group-hover:text-stone-950">
                  <Icon className="size-5" />
                </div>
                <ArrowUpRight className="size-4 text-stone-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-stone-900" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-stone-900">
                {t(`marketing.landing.tools.items.${key}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                {t(`marketing.landing.tools.items.${key}.body`)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
