import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InspectionStatus } from 'shared-schemas';
import { useUpdateInspection } from '@/api/hooks/useInspections';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type InspectionStatusCardProps = {
  inspectionId: string;
  status: InspectionStatus;
  inspectionDate: string;
};

/**
 * Inline pending-action bar. Renders only when the inspection still needs
 * a decision (scheduled / overdue). Current status itself lives in the
 * header chip — this is purely the action prompt.
 */
export const InspectionStatusCard = ({
  inspectionId,
  status,
}: InspectionStatusCardProps) => {
  const { t } = useTranslation('inspection');
  const queryClient = useQueryClient();
  const { mutate: updateInspection, isPending } = useUpdateInspection();

  const isOverdue = status === InspectionStatus.OVERDUE;
  const isScheduled = status === InspectionStatus.SCHEDULED;
  const showActions = isScheduled || isOverdue;

  if (!showActions) return null;

  const handleComplete = () =>
    updateInspection(
      { id: inspectionId, data: { status: InspectionStatus.COMPLETED } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['inspections'] });
        },
      },
    );

  const handleCancel = () =>
    updateInspection(
      { id: inspectionId, data: { status: InspectionStatus.CANCELLED } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['inspections'] });
        },
      },
    );

  const Icon = isOverdue ? AlertTriangle : Clock;

  return (
    <div
      className={cn(
        '@container/status rounded-xl border px-4 @sm/status:px-5 py-3 flex flex-col @sm/status:flex-row @sm/status:items-center gap-3 @sm/status:gap-4',
        isOverdue
          ? 'border-red-300/70 bg-red-50/70 dark:border-red-900/60 dark:bg-red-950/30'
          : 'border-amber-300/70 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/30',
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-full',
            isOverdue
              ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <div className="font-overline text-stone-500 dark:text-stone-400">
            {t('inspection:statusCard.title')}
          </div>
          <div className="text-sm font-medium text-stone-800 dark:text-stone-200">
            {isOverdue
              ? t('inspection:statusCard.overduePrompt', {
                  defaultValue:
                    'This inspection is past its scheduled date — record the outcome.',
                })
              : t('inspection:statusCard.scheduledPrompt', {
                  defaultValue:
                    'This inspection is scheduled — mark it complete once finished.',
                })}
          </div>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          onClick={handleComplete}
          disabled={isPending}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CheckCircle className="h-4 w-4 mr-1.5" />
          {t('inspection:statusCard.markCompleted')}
        </Button>
        <Button
          onClick={handleCancel}
          disabled={isPending}
          variant="outline"
          size="sm"
        >
          <XCircle className="h-4 w-4 mr-1.5" />
          {t('inspection:statusCard.cancelInspection')}
        </Button>
      </div>
    </div>
  );
};
