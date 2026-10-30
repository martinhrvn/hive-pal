import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  useInspections,
  useActions,
  useQuickChecks,
  useHives,
  useDeleteQuickCheck,
  usePhotos,
  useDocuments,
  useDeletePhoto,
  useDeleteDocument,
} from '@/api/hooks';
import { useApiary } from '@/hooks/use-apiary';
import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';
import {
  TimelineEventList,
  type TimelineEventHandlers,
} from '@/components/common/timeline-event-list';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';
import { QuickAddMenu } from '@/components/quick-add-menu';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  InspectionResponse,
  ActionResponse,
  QuickCheckResponse,
  PhotoResponse,
  DocumentResponse,
} from 'shared-schemas';

// The one entry currently awaiting delete confirmation, if any.
type PendingDelete =
  | { kind: 'quickCheck'; item: QuickCheckResponse }
  | { kind: 'photo'; item: PhotoResponse }
  | { kind: 'document'; item: DocumentResponse };

export const ApiaryTimeline = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { activeApiaryId, viewAllApiaries } = useApiary();
  const { canEdit } = useApiaryPermission();
  // Lists span every apiary in the all-apiaries view, otherwise the selected one.
  const listFilter =
    viewAllApiaries || !activeApiaryId
      ? undefined
      : { apiaryId: activeApiaryId };
  const listEnabled = viewAllApiaries || !!activeApiaryId;
  // The last entry stays set after closing so the dialog keeps its copy
  // through the exit animation.
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const requestDelete = useCallback((next: PendingDelete) => {
    setPendingDelete(next);
    setConfirmOpen(true);
  }, []);
  const deleteQuickCheckMutation = useDeleteQuickCheck();
  const deletePhotoMutation = useDeletePhoto();
  const deleteDocumentMutation = useDeleteDocument();

  const { data: inspections, isLoading: inspectionsLoading } = useInspections();
  const { data: actions, isLoading: actionsLoading } = useActions(undefined, {
    enabled: listEnabled,
  });
  const { data: quickChecks, isLoading: quickChecksLoading } = useQuickChecks(
    listFilter,
    { enabled: listEnabled },
  );
  const { data: photos, isLoading: photosLoading } = usePhotos(listFilter, {
    enabled: listEnabled,
  });
  const { data: documents, isLoading: documentsLoading } = useDocuments(
    listFilter,
    { enabled: listEnabled },
  );
  const { data: hives } = useHives();

  const { hiveList, hiveNameById } = useMemo(() => {
    const list = hives?.map(h => ({ id: h.id, name: h.name })) ?? [];
    return {
      hiveList: list,
      hiveNameById: new Map(list.map(h => [h.id, h.name])),
    };
  }, [hives]);

  const getHiveName = useCallback(
    (hiveId: string) => hiveNameById.get(hiveId),
    [hiveNameById],
  );

  const handlers = useMemo<TimelineEventHandlers>(
    () => ({
      onInspectionClick: (inspection: InspectionResponse) =>
        navigate(`/inspections/${inspection.id}`),
      onActionClick: (action: ActionResponse) => {
        if (action.harvestId) {
          navigate(`/harvests/${action.harvestId}`);
        } else if (action.hiveId) {
          navigate(`/hives/${action.hiveId}`);
        }
      },
      ...(canEdit && {
        onDeleteQuickCheck: item => requestDelete({ kind: 'quickCheck', item }),
        onDeletePhoto: item => requestDelete({ kind: 'photo', item }),
        onDeleteDocument: item => requestDelete({ kind: 'document', item }),
      }),
    }),
    [navigate, canEdit, requestDelete],
  );

  // Copy and mutation per kind of entry being deleted.
  const deleteConfig = {
    quickCheck: {
      mutation: deleteQuickCheckMutation,
      title: t('common:quickCheck.deleteTitle'),
      description: t('common:quickCheck.deleteDescription'),
      success: t('common:quickCheck.deleted'),
      failure: t('common:quickCheck.deleteFailed'),
    },
    photo: {
      mutation: deletePhotoMutation,
      title: t('common:photo.deleteTitle', { defaultValue: 'Delete Photo?' }),
      description: t('common:photo.deleteDescription', {
        defaultValue:
          'This action cannot be undone. This will permanently delete this photo.',
      }),
      success: t('common:photo.deleted', { defaultValue: 'Photo deleted' }),
      failure: t('common:photo.deleteFailed', {
        defaultValue: 'Failed to delete photo',
      }),
    },
    document: {
      mutation: deleteDocumentMutation,
      title: t('common:document.deleteTitle', {
        defaultValue: 'Delete Document?',
      }),
      description: t('common:document.deleteDescription', {
        defaultValue:
          'This action cannot be undone. This will permanently delete this document.',
      }),
      success: t('common:document.deleted', {
        defaultValue: 'Document deleted',
      }),
      failure: t('common:document.deleteFailed', {
        defaultValue: 'Failed to delete document',
      }),
    },
  };
  const activeDelete = pendingDelete ? deleteConfig[pendingDelete.kind] : null;

  const handleDeleteConfirm = async () => {
    if (!pendingDelete || !activeDelete) return;
    try {
      await activeDelete.mutation.mutateAsync(pendingDelete.item.id);
      toast.success(activeDelete.success);
      setConfirmOpen(false);
    } catch {
      toast.error(activeDelete.failure);
    }
  };

  return (
    <DashboardSection
      storageKey="home-section:timeline"
      title={t('common:timeline.recentActivity')}
      action={
        canEdit && activeApiaryId ? (
          <QuickAddMenu apiaryId={activeApiaryId} variant="inline" />
        ) : undefined
      }
    >
      <TimelineEventList
        inspections={inspections ?? []}
        actions={actions ?? []}
        quickChecks={quickChecks ?? []}
        photos={photos ?? []}
        documents={documents ?? []}
        isLoading={
          inspectionsLoading ||
          actionsLoading ||
          quickChecksLoading ||
          photosLoading ||
          documentsLoading
        }
        emptyMessage={
          viewAllApiaries
            ? t('common:timeline.noActivity')
            : t('common:timeline.noActivityApiary')
        }
        getHiveName={getHiveName}
        hives={hiveList}
        handlers={handlers}
      />

      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => void handleDeleteConfirm()}
        isPending={activeDelete?.mutation.isPending}
        title={activeDelete?.title ?? ''}
        description={activeDelete?.description ?? ''}
      />
    </DashboardSection>
  );
};
