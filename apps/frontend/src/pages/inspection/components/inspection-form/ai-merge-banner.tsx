import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Props = {
  pendingCount: number;
  conflictCount: number;
  onAcceptAllSafe: () => void;
  onReviewConflicts: () => void;
  onDismissAll: () => void;
};

export function AiMergeBanner({
  pendingCount,
  conflictCount,
  onAcceptAllSafe,
  onReviewConflicts,
  onDismissAll,
}: Props) {
  const { t } = useTranslation('ai');

  if (pendingCount === 0) return null;

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
      <AlertDescription className="space-y-3">
        <div>
          <div className="font-medium">{t('banner.title')}</div>
          <div className="text-sm opacity-80">
            {conflictCount > 0
              ? t('banner.summaryWithConflicts', {
                  pending: t('banner.pending', { count: pendingCount }),
                  conflicts: t('banner.conflicts', { count: conflictCount }),
                })
              : t('banner.summary', {
                  pending: t('banner.pending', { count: pendingCount }),
                })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={onAcceptAllSafe}>
            {t('banner.acceptAllSafe')}
          </Button>

          {conflictCount > 0 && (
            <Button type="button" size="sm" variant="outline" onClick={onReviewConflicts}>
              {t('banner.reviewConflicts')}
            </Button>
          )}

          <Button type="button" size="sm" variant="ghost" onClick={onDismissAll}>
            {t('banner.dismissAll')}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
