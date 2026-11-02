import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { PublicMeta } from '@/components/seo/public-meta';

const CONTACT_EMAIL = 'info@hivepal.app';

/**
 * How to delete an account and its data. Required by Facebook Login (the app's
 * "User data deletion" URL) and linked from the privacy policy.
 */
export const DataDeletionPage = () => {
  const { t } = useTranslation('privacy');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <PublicMeta
        title={t('dataDeletion.meta.title')}
        description={t('dataDeletion.meta.description')}
        path="/data-deletion"
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
            <h1 className="text-3xl font-bold text-gray-900">
              {t('dataDeletion.title')}
            </h1>
            <LanguageSwitcher variant="buttons" />
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8">{t('dataDeletion.intro')}</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('dataDeletion.inApp.title')}
              </h2>
              <p className="text-gray-600">
                {t('dataDeletion.inApp.content', {
                  action: t('common:settings.deleteAccount'),
                })}
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/settings">{t('dataDeletion.inApp.action')}</Link>
              </Button>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('dataDeletion.byEmail.title')}
              </h2>
              <p className="text-gray-600">
                {t('dataDeletion.byEmail.content')}{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Data deletion request')}`}
                  className="text-blue-600 hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p className="text-gray-600 mt-4">
                {t('dataDeletion.byEmail.details')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('dataDeletion.facebook.title')}
              </h2>
              <p className="text-gray-600">
                {t('dataDeletion.facebook.content')}
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              {t('footer.company')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDeletionPage;
