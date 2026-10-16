import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  HexBullet,
  SectionLabel,
} from '@/components/marketing/marketing-chrome';
import { MarketingButton } from '@/components/marketing/marketing-button';
import { MarketingHeading } from '@/components/marketing/marketing-primitives';
import { GITHUB_URL } from '@/components/marketing/marketing-constants';

/** `t(key, { returnObjects: true })` as a string list, empty if the key is missing. */
const toList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String) : [];

const PLAN_TONE = {
  light: {
    card: 'border-stone-900/10 bg-white/60 backdrop-blur-sm',
    title: 'text-stone-900',
    badge: 'text-stone-500',
    body: 'text-stone-600',
    list: 'text-stone-700',
    bullet: undefined,
    rule: 'bg-stone-900/10',
  },
  dark: {
    card: 'border-amber-700/40 bg-stone-900 text-amber-50 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.4)]',
    title: 'text-amber-50',
    badge: 'text-amber-200/80',
    body: 'text-amber-50/75',
    list: 'text-amber-50/85',
    bullet: 'text-amber-300',
    rule: 'bg-amber-50/10',
  },
} as const;

function PlanCard({
  tone,
  title,
  badge,
  body,
  items,
  action,
}: {
  tone: keyof typeof PLAN_TONE;
  title: string;
  badge: string;
  body: string;
  items: string[];
  action: React.ReactNode;
}) {
  const styles = PLAN_TONE[tone];
  return (
    <div className={cn('relative rounded-2xl border p-10', styles.card)}>
      <div className="flex items-center justify-between">
        <h3 className={cn('text-2xl font-semibold', styles.title)}>{title}</h3>
        <span className={cn('text-sm', styles.badge)}>{badge}</span>
      </div>
      <p className={cn('mt-6 text-sm leading-relaxed', styles.body)}>{body}</p>
      <ul className={cn('mt-8 space-y-3 text-sm', styles.list)}>
        {items.map(item => (
          <li key={item} className="flex items-center gap-3">
            <HexBullet className={styles.bullet} />
            {item}
          </li>
        ))}
      </ul>
      <div className={cn('mt-10 h-px', styles.rule)} />
      <div className="mt-6">{action}</div>
    </div>
  );
}

export function LandingPlans() {
  const { t } = useTranslation('common');
  return (
    <section className="border-b border-stone-900/10 bg-cream py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center">
            <SectionLabel>{t('marketing.landing.run.label')}</SectionLabel>
          </div>
          <MarketingHeading className="mt-6 text-stone-900">
            <Trans
              t={t}
              i18nKey="marketing.landing.run.title"
              components={{ accent: <span className="text-amber-700" /> }}
            />
          </MarketingHeading>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-stone-600">
            {t('marketing.landing.run.lede')}
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2">
          <PlanCard
            tone="light"
            title={t('marketing.landing.run.selfHosted.title')}
            badge={t('marketing.landing.run.selfHosted.badge')}
            body={t('marketing.landing.run.selfHosted.body')}
            items={toList(
              t('marketing.landing.run.selfHosted.items', {
                returnObjects: true,
              }),
            )}
            action={
              <MarketingButton
                variant="outline"
                size="lg"
                className="w-full"
                asChild
              >
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  <BookOpen className="size-4" />
                  {t('marketing.landing.run.selfHosted.cta')}
                </a>
              </MarketingButton>
            }
          />
          <PlanCard
            tone="dark"
            title={t('marketing.landing.run.hosted.title')}
            badge={t('marketing.landing.run.hosted.badge')}
            body={t('marketing.landing.run.hosted.body')}
            items={toList(
              t('marketing.landing.run.hosted.items', { returnObjects: true }),
            )}
            action={
              <MarketingButton
                variant="primary"
                size="lg"
                className="w-full shadow-none"
                asChild
              >
                <Link to="/register">
                  {t('marketing.landing.run.hosted.cta')}
                  <ArrowUpRight className="size-4" />
                </Link>
              </MarketingButton>
            }
          />
        </div>
      </div>
    </section>
  );
}
