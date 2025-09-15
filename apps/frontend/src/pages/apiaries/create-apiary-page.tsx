import { useTranslation } from 'react-i18next';
import { ApiaryForm } from './components/apiary-form';

export const CreateApiaryPage = () => {
  const { t } = useTranslation('apiary');

  return (
    <div className="flex flex-col space-y-6 p-6 max-w-4xl">
      <h1 className="text-3xl font-bold">{t('create.title')}</h1>
      <ApiaryForm />
    </div>
  );
};
