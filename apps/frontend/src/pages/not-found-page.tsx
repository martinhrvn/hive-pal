import { useTranslation } from 'react-i18next';

export const NotFoundPage = () => {
  const { t } = useTranslation('common');
  return (
    <>
      <title>{t('errorPage.notFound.pageTitle')}</title>
      <div>{t('errorPage.notFound.heading')}</div>
    </>
  );
};
