import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/dashboard/empty-state';

export const QueenNotFound = () => {
  const { t } = useTranslation('queen');
  return (
    <div className="container mx-auto max-w-3xl p-4">
      <EmptyState
        icon={<Crown />}
        title={t('detail.notFound.title')}
        description={t('detail.notFound.description')}
      >
        <Button asChild>
          <Link to="/queens">{t('detail.notFound.cta')}</Link>
        </Button>
      </EmptyState>
    </div>
  );
};
