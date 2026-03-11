import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useInspections,
  useActions,
  useQuickChecks,
  useHives,
  useDeleteQuickCheck,
} from '@/api/hooks';
import { useApiary } from '@/hooks/use-apiary';
import { Section } from '@/components/common/section';
import { TimelineEventList } from '@/components/common/timeline-event-list';
import { QuickCheckDialog } from '@/pages/hive/hive-detail-page/quick-check-dialog';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  InspectionResponse,
  ActionResponse,
  QuickCheckResponse,
} from 'shared-schemas';

export const ApiaryTimeline = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { activeApiaryId } = useApiary();
  const [deletingQuickCheck, setDeletingQuickCheck] =
    useState<QuickCheckResponse | null>(null);
  const deleteQuickCheckMutation = useDeleteQuickCheck();

  const handleDeleteQuickCheckConfirm = async () => {
    if (!deletingQuickCheck) return;
    try {
      await deleteQuickCheckMutation.mutateAsync(deletingQuickCheck.id);
      toast.success(t('common:quickCheck.deleted'));
      setDeletingQuickCheck(null);
    } catch {
      toast.error(t('common:quickCheck.deleteFailed'));
    }
  };

  const { data: inspections, isLoading: inspectionsLoading } = useInspections();
  const { data: actions, isLoading: actionsLoading } = useActions();
  const { data: quickChecks, isLoading: quickChecksLoading } = useQuickChecks(
    activeApiaryId ? { apiaryId: activeApiaryId } : undefined,
    { enabled: !!activeApiaryId },
  );
  const { data: hives } = useHives();

  const hiveList = useMemo(
    () => hives?.map(h => ({ id: h.id, name: h.name })) ?? [],
    [hives],
  );

  const getHiveName = useCallback(
    (hiveId: string) => hives?.find(h => h.id === hiveId)?.name,
    [hives],
  );

  const handleInspectionClick = useCallback(
    (inspection: InspectionResponse) => {
      navigate(`/inspections/${inspection.id}`);
    },
    [navigate],
  );

  const handleActionClick = useCallback(
    (action: ActionResponse) => {
      if (action.harvestId) {
        navigate(`/harvests/${action.harvestId}`);
      } else if (action.hiveId) {
        navigate(`/hives/${action.hiveId}`);
      }
    },
    [navigate],
  );

  return (
    <Section title={t('common:timeline.recentActivity')}>
      <TimelineEventList
        inspections={inspections ?? []}
        actions={actions ?? []}
        quickChecks={quickChecks ?? []}
        isLoading={inspectionsLoading || actionsLoading || quickChecksLoading}
        emptyMessage={t('common:timeline.noActivityApiary')}
        getHiveName={getHiveName}
        hives={hiveList}
        onInspectionClick={handleInspectionClick}
        onActionClick={handleActionClick}
        onDeleteQuickCheck={setDeletingQuickCheck}
        headerSlot={
          activeApiaryId ? (
            <QuickCheckDialog
              apiaryId={activeApiaryId}
              triggerVariant="inline"
            />
          ) : undefined
        }
      />

      {/* Delete Quick Check Confirmation Dialog */}
      <Dialog
        open={!!deletingQuickCheck}
        onOpenChange={open => !open && setDeletingQuickCheck(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common:quickCheck.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('common:quickCheck.deleteDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteQuickCheckConfirm}
              disabled={deleteQuickCheckMutation.isPending}
            >
              {deleteQuickCheckMutation.isPending ? t('common:status.loading') : t('common:actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
};
