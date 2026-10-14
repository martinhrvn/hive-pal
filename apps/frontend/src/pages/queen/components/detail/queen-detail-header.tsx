import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftRight, Pencil, Trash2 } from 'lucide-react';
import type { QueenDetail } from 'shared-schemas';
import { StatusPill } from '@/components/common/status-pill';
import { Button } from '@/components/ui/button';
import {
  QUEEN_STATUS_TONE,
  getQueenColorClass,
  getQueenDisplayName,
  queenStatusLabelKey,
} from '@/lib/queen-utils';
import { cn } from '@/lib/utils';

export type QueenDetailActions = {
  onTransfer: () => void;
  onDelete: () => void;
};

export const QueenDetailHeader = ({
  queen,
  actions,
}: {
  queen: QueenDetail;
  /** Omitted for viewers. */
  actions?: QueenDetailActions;
}) => {
  const { t } = useTranslation(['queen', 'common']);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'size-10 shrink-0 rounded-full border border-border',
            getQueenColorClass(queen.color),
          )}
        />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold">
              {getQueenDisplayName(t, queen)}
            </h1>
            {queen.status && (
              <StatusPill tone={QUEEN_STATUS_TONE[queen.status]}>
                {t(queenStatusLabelKey(queen.status))}
              </StatusPill>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {queen.hiveId && queen.hiveName ? (
              <Link
                to={`/hives/${queen.hiveId}`}
                className="rounded-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t('detail.currentlyIn', { hive: queen.hiveName })}
              </Link>
            ) : (
              t('detail.notInHive')
            )}
          </p>
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={actions.onTransfer}>
            <ArrowLeftRight className="size-4" />
            {t('actions.transferQueen')}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/queens/${queen.id}/edit`}>
              <Pencil className="size-4" />
              {t('common:actions.edit')}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={actions.onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            {t('common:actions.delete')}
          </Button>
        </div>
      )}
    </div>
  );
};
