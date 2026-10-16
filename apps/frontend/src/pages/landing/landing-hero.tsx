import { useTranslation, Trans } from 'react-i18next';
import { MarketingCtas } from '@/components/marketing/marketing-primitives';

export function LandingHero() {
  const { t } = useTranslation('common');
  return (
    <section className="relative flex min-h-[640px] items-center justify-center overflow-hidden">
      {/* The hero photo is the largest paint: load it early, sized to the viewport. */}
      <picture>
        <source
          type="image/webp"
          srcSet="/hero-768.webp 768w, /hero-1280.webp 1280w, /hero-1920.webp 1920w"
          sizes="100vw"
        />
        <img
          src="/hero-1920.jpg"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      </picture>
      {/* Overlay for legibility: dark wash, radial focus behind the text, grain */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/55 via-stone-950/55 to-stone-950/75" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,12,8,0.55)_0%,rgba(15,12,8,0)_65%)]" />
      <div className="bg-noise absolute inset-0 opacity-[0.18] mix-blend-overlay" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/50 bg-stone-950/60 px-3.5 py-1 text-xs font-medium uppercase tracking-[0.22em] text-amber-100 backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-amber-300" />
          {t('marketing.landing.hero.badge')}
        </div>

        <h1 className="font-marketing-display mt-8 text-[clamp(2.75rem,6vw,5rem)] leading-[1.02] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.7)]">
          <Trans
            t={t}
            i18nKey="marketing.landing.hero.title"
            components={{
              br: <br />,
              accent: (
                <span className="font-marketing-display-strong text-amber-300" />
              ),
            }}
          />
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">
          {t('marketing.landing.hero.lede')}
        </p>

        <div className="mt-10">
          <MarketingCtas
            variant="heroOnImage"
            signupLabel={t('marketing.landing.hero.ctaSignup')}
            githubLabel={t('marketing.landing.hero.ctaSelfHost')}
          />
        </div>

        <div className="mx-auto mt-12 flex max-w-md items-center justify-center gap-4 text-xs font-medium uppercase tracking-[0.22em] text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
          <span className="h-px flex-1 bg-white/40" />
          <span>{t('marketing.landing.hero.tagline')}</span>
          <span className="h-px flex-1 bg-white/40" />
        </div>
      </div>
    </section>
  );
}
