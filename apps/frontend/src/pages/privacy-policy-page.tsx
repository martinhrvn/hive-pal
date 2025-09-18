import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export const PrivacyPolicyPage = () => {
  const { t, i18n } = useTranslation('privacy');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
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
            <div className="flex gap-2">
              <Button
                variant={i18n.language === 'sk' ? 'default' : 'outline'}
                size="sm"
                onClick={() => i18n.changeLanguage('sk')}
              >
                SK
              </Button>
              <Button
                variant={i18n.language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => i18n.changeLanguage('en')}
              >
                EN
              </Button>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="mb-8">
              <p className="text-gray-600">{t('intro')}</p>
              <p className="text-gray-600 mt-4">{t('operator')}</p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('rightToInformation.title')}</h2>
              <p className="text-gray-600">{t('rightToInformation.content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('security.title')}</h2>
              <p className="text-gray-600">{t('security.content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('dataProtection.title')}</h2>
              <p className="text-gray-600">{t('dataProtection.content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('dataUsage.title')}</h2>
              <p className="text-gray-600">{t('dataUsage.content')}</p>
              <p className="text-gray-600 mt-4">{t('dataUsage.marketing')}</p>
              <p className="text-gray-600 mt-4">{t('dataUsage.authorities')}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('newsletter.title')}</h2>
              <p className="text-gray-600">{t('newsletter.content')}</p>
              <p className="text-gray-600 mt-4">{t('newsletter.unsubscribe')}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('cookies.title')}</h2>
              <p className="text-gray-600">{t('cookies.content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('consent.title')}</h2>
              <p className="text-gray-600">{t('consent.content')}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t('contact.title')}</h2>
              <p className="text-gray-600">
                {t('contact.content')}{' '}
                <a href="mailto:info@hivepal.app" className="text-blue-600 hover:underline">
                  info@hivepal.app
                </a>
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              {t('footer.company')} | {t('footer.lastUpdated')}: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;