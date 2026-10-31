import { Link } from 'react-router';
import { Crown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHiveQueenHistory } from '@/api/hooks';
import { useTranslation } from 'react-i18next';
import { ActiveQueen } from 'shared-schemas';
import { QueenTable } from '@/pages/queen/components/queen-table';

type QueenHistoryTabProps = {
  hiveId: string;
  activeQueen?: ActiveQueen | null;
};

export const QueenHistoryTab: React.FC<QueenHistoryTabProps> = ({
  hiveId,
  activeQueen,
}) => {
  const { data: queens, isLoading } = useHiveQueenHistory(hiveId);
  const { t } = useTranslation('queen');

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!queens || queens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Crown className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">{t('list.noHiveHistory')}</p>
        <Button size="sm" asChild>
          <Link to={`/hives/${hiveId}/queens/create`}>
            <Plus className="mr-1 h-4 w-4" />
            {t('actions.addQueen')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{t('title')}</h3>
        <div className="flex gap-2">
          {activeQueen && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/queens/${activeQueen.id}`}>
                {t('actions.viewDetails')}
              </Link>
            </Button>
          )}
          <Button size="sm" asChild>
            <Link to={`/hives/${hiveId}/queens/create`}>
              <Plus className="mr-1 h-4 w-4" />
              {activeQueen ? t('actions.replaceQueen') : t('actions.addQueen')}
            </Link>
          </Button>
        </div>
      </div>
      <QueenTable queens={queens} showReplaced />
    </div>
  );
};
