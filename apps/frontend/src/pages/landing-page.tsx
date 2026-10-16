import { useTranslation } from 'react-i18next';
import { PublicMeta } from '@/components/seo/public-meta';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { MarketingAiSection } from '@/components/marketing/marketing-ai-section';
import { MarketingCtaSection } from '@/components/marketing/marketing-cta-section';
import { LandingHero } from './landing/landing-hero';
import { LandingPillars } from './landing/landing-pillars';
import { LandingPlans } from './landing/landing-plans';
import { LandingTools } from './landing/landing-tools';

export function LandingPage() {
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

  return (
    <MarketingLayout>
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
      <LandingHero />
      <LandingPillars />
      <MarketingAiSection />
      <LandingPlans />
      <LandingTools />
      <MarketingCtaSection i18nPrefix="marketing.landing.cta" />
    </MarketingLayout>
  );
}
