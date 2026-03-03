import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';

export const PublicFooter = () => {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="absolute bottom-0 left-0 right-0 p-4 text-center text-white/70 text-sm">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/privacy-policy" className="hover:text-white underline">
            {t('footer.privacyPolicy')}
          </Link>
          <span>|</span>
          <span>© {currentYear} HRVN s.r.o.</span>
        </div>
        <LanguageSwitcher variant="buttons" className="opacity-80 hover:opacity-100 transition-opacity" />
      </div>
    </footer>
  );
};
