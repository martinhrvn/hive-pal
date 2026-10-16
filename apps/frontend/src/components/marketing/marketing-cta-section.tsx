import { useTranslation, Trans } from 'react-i18next';
import {
  HexPattern,
  MarketingCtas,
  MarketingHeading,
} from './marketing-primitives';

/**
 * Closing call to action: logo, heading, lede and the sign-up + GitHub pair.
 * Copy comes from `<i18nPrefix>.{title,lede,signup,github}`.
 */
export function MarketingCtaSection({
  i18nPrefix,
}: Readonly<{
  i18nPrefix: 'marketing.landing.cta' | 'marketing.features.cta';
}>) {
  const { t } = useTranslation('common');
  return (
    <section className="relative overflow-hidden bg-cream py-24 sm:py-32">
      <HexPattern tone="light" />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <picture>
          <source srcSet="/hive-pal-logo-112.webp" type="image/webp" />
          <img
            src="/hive-pal-logo-112.png"
            alt=""
            aria-hidden="true"
            width={49}
            height={56}
            loading="lazy"
            className="mx-auto h-14 w-auto opacity-90"
          />
        </picture>
        <MarketingHeading size="xl" className="mt-8 text-stone-900">
          <Trans
            t={t}
            i18nKey={`${i18nPrefix}.title`}
            components={{ accent: <span className="text-amber-700" /> }}
          />
        </MarketingHeading>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-stone-600">
          {t(`${i18nPrefix}.lede`)}
        </p>
        <div className="mt-10">
          <MarketingCtas
            variant="closing"
            signupLabel={t(`${i18nPrefix}.signup`)}
            githubLabel={t(`${i18nPrefix}.github`)}
          />
        </div>
      </div>
    </section>
  );
}
