import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { AnalyticsOptOut } from '@/components/privacy/analytics-opt-out';
import { PublicMeta } from '@/components/seo/public-meta';

const CONTACT_EMAIL = 'info@hivepal.app';

function Section({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

export const PrivacyPolicyPage = () => {
  const { t, i18n } = useTranslation('privacy');

  // Rendered from a fixed revision date in the translations, not from today's
  // date, so the policy states when it actually changed.
  const lastUpdated = new Intl.DateTimeFormat(i18n.language).format(
    new Date(`${t('footer.lastUpdatedDate')}T12:00:00`),
  );

  const purposes = [
    'account',
    'analytics',
    'monitoring',
    'newsletter',
    'logs',
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <PublicMeta
        title={t('meta.title')}
        description={t('meta.description')}
        path="/privacy-policy"
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t('back')}
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <LanguageSwitcher variant="buttons" />
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="mb-8">
              <p className="text-gray-600">{t('intro')}</p>
              <p className="text-gray-600 mt-4">{t('operator')}</p>
            </div>

            <Section title={t('controller.title')}>
              <p className="text-gray-600">{t('controller.content')}</p>
            </Section>

            <Section title={t('dataProtection.title')}>
              <p className="text-gray-600">{t('dataProtection.content')}</p>
              {purposes.map(purpose => (
                <div key={purpose} className="mt-5">
                  <h3 className="text-lg font-semibold mb-1">
                    {t(`dataProtection.${purpose}.title`)}
                  </h3>
                  <p className="text-gray-600">
                    {t(`dataProtection.${purpose}.content`)}
                  </p>
                </div>
              ))}
            </Section>

            <Section title={t('cookies.title')}>
              <p className="text-gray-600">{t('cookies.content')}</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">
                <li>{t('cookies.session')}</li>
                <li>{t('cookies.ui')}</li>
                <li>{t('cookies.preferences')}</li>
              </ul>
              <p className="text-gray-600 mt-4">
                {t('cookies.noThirdParties')}
              </p>
            </Section>

            <Section title={t('analyticsChoice.title')}>
              <AnalyticsOptOut />
            </Section>

            <Section title={t('retention.title')}>
              <p className="text-gray-600">{t('retention.content')}</p>
            </Section>

            <Section title={t('recipients.title')}>
              <p className="text-gray-600">{t('recipients.content')}</p>
            </Section>

            <Section title={t('rights.title')}>
              <p className="text-gray-600">{t('rights.content')}</p>
              <p className="text-gray-600 mt-4">{t('rights.complaint')}</p>
            </Section>

            <Section title={t('deletion.title')}>
              <p className="text-gray-600">
                {t('deletion.content')}{' '}
                <Link
                  to="/data-deletion"
                  className="text-blue-600 hover:underline"
                >
                  {t('deletion.link')}
                </Link>
              </p>
            </Section>

            <Section title={t('security.title')}>
              <p className="text-gray-600">{t('security.content')}</p>
            </Section>

            <Section title={t('changes.title')}>
              <p className="text-gray-600">{t('changes.content')}</p>
            </Section>

            <Section title={t('contact.title')}>
              <p className="text-gray-600">
                {t('contact.content')}{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-blue-600 hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </Section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              {t('footer.company')} | {t('footer.lastUpdated')}: {lastUpdated}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
