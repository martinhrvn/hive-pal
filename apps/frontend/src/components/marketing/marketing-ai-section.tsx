import { useTranslation, Trans } from 'react-i18next';
import { Mic, Plug, Sparkles, Wand2 } from 'lucide-react';
import { SectionLabel } from './marketing-chrome';
import { HexPattern, MarketingHeading } from './marketing-primitives';

import { AI_ITEM_KEYS } from './marketing-constants';

// Structure lives in code; copy comes from i18n under `marketing.ai.*`.
const AI_ICONS = {
  record: Mic,
  transcribe: Wand2,
  draft: Sparkles,
  mcp: Plug,
} as const;

/** Voice & AI: the dark headline section shared by the landing and features pages. */
export function MarketingAiSection() {
  const { t } = useTranslation('common');
  return (
    <section className="relative overflow-hidden bg-forest py-24 text-amber-50 sm:py-32">
      <HexPattern tone="dark" />
      <div
        aria-hidden="true"
        className="absolute -top-32 right-[-10%] size-[420px] rounded-full bg-amber-500/12 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 left-[-10%] size-[480px] rounded-full bg-emerald-500/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionLabel tone="dark">{t('marketing.ai.eyebrow')}</SectionLabel>
            <MarketingHeading className="mt-6">
              <Trans
                t={t}
                i18nKey="marketing.ai.title"
                components={{
                  br: <br />,
                  accent: <span className="text-amber-200" />,
                }}
              />
            </MarketingHeading>
          </div>
          <p className="text-base leading-relaxed text-amber-50/75 lg:col-span-5">
            {t('marketing.ai.lede')}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-amber-50/10 sm:grid-cols-2 lg:grid-cols-4">
          {AI_ITEM_KEYS.map(key => {
            const Icon = AI_ICONS[key];
            return (
              <div
                key={key}
                className="relative bg-forest p-8 transition-colors hover:bg-forest-2"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-amber-400/15 text-amber-200">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-amber-50">
                  {t(`marketing.ai.items.${key}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-amber-50/70">
                  {t(`marketing.ai.items.${key}.body`)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-16 max-w-3xl text-center">
          <p className="text-base leading-relaxed text-amber-50/85 sm:text-lg">
            <span className="font-semibold text-amber-100">
              {t('marketing.ai.assuranceLead')}
            </span>{' '}
            {t('marketing.ai.assuranceBody')}
          </p>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.24em] text-amber-200/70">
            {t('marketing.ai.assuranceNote')}
          </p>
        </div>
      </div>
    </section>
  );
}
