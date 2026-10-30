import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { ApiaryForm } from './components/apiary-form';

export const EditApiaryPage = () => {
  const { t } = useTranslation('apiary');
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col space-y-6 p-6 max-w-4xl">
      <h1 className="text-3xl font-bold">
        {t('edit.title', { defaultValue: 'Edit Apiary' })}
      </h1>
      <ApiaryForm apiaryId={id} />
    </div>
  );
};
