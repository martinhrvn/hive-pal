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
  usePhotos,
  useDocuments,
  useDeletePhoto,
  useDeleteDocument,
} from '@/api/hooks';
import { useApiary } from '@/hooks/use-apiary';
import { Section } from '@/components/common/section';
import { TimelineEventList } from '@/components/common/timeline-event-list';
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

export const ApiaryTimeline = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { activeApiaryId } = useApiary();
  const [deletingQuickCheck, setDeletingQuickCheck] =
    useState<QuickCheckResponse | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<PhotoResponse | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<DocumentResponse | null>(null);
  const deleteQuickCheckMutation = useDeleteQuickCheck();
  const deletePhotoMutation = useDeletePhoto();
  const deleteDocumentMutation = useDeleteDocument();

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

  const handleDeletePhotoConfirm = async () => {
    if (!deletingPhoto) return;
    try {
      await deletePhotoMutation.mutateAsync(deletingPhoto.id);
      toast.success(t('common:photo.deleted', { defaultValue: 'Photo deleted' }));
      setDeletingPhoto(null);
    } catch {
      toast.error(t('common:photo.deleteFailed', { defaultValue: 'Failed to delete photo' }));
    }
  };

  const handleDeleteDocumentConfirm = async () => {
    if (!deletingDocument) return;
    try {
      await deleteDocumentMutation.mutateAsync(deletingDocument.id);
      toast.success(t('common:document.deleted', { defaultValue: 'Document deleted' }));
      setDeletingDocument(null);
    } catch {
      toast.error(t('common:document.deleteFailed', { defaultValue: 'Failed to delete document' }));
    }
  };

  const { data: inspections, isLoading: inspectionsLoading } = useInspections();
  const { data: actions, isLoading: actionsLoading } = useActions();
  const { data: quickChecks, isLoading: quickChecksLoading } = useQuickChecks(
    activeApiaryId ? { apiaryId: activeApiaryId } : undefined,
    { enabled: !!activeApiaryId },
  );
  const { data: photos, isLoading: photosLoading } = usePhotos(
    activeApiaryId ? { apiaryId: activeApiaryId } : undefined,
    { enabled: !!activeApiaryId },
  );
  const { data: documents, isLoading: documentsLoading } = useDocuments(
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
        photos={photos ?? []}
        documents={documents ?? []}
        isLoading={inspectionsLoading || actionsLoading || quickChecksLoading || photosLoading || documentsLoading}
        emptyMessage={t('common:timeline.noActivityApiary')}
        getHiveName={getHiveName}
        hives={hiveList}
        onInspectionClick={handleInspectionClick}
        onActionClick={handleActionClick}
        onDeleteQuickCheck={setDeletingQuickCheck}
        onDeletePhoto={setDeletingPhoto}
        onDeleteDocument={setDeletingDocument}
        headerSlot={
          activeApiaryId ? (
            <QuickAddMenu apiaryId={activeApiaryId} variant="inline" />
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

      {/* Delete Photo Confirmation Dialog */}
      <Dialog
        open={!!deletingPhoto}
        onOpenChange={open => !open && setDeletingPhoto(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common:photo.deleteTitle', { defaultValue: 'Delete Photo?' })}</DialogTitle>
            <DialogDescription>
              {t('common:photo.deleteDescription', { defaultValue: 'This action cannot be undone. This will permanently delete this photo.' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('common:actions.cancel')}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeletePhotoConfirm}
              disabled={deletePhotoMutation.isPending}
            >
              {deletePhotoMutation.isPending ? t('common:status.loading') : t('common:actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Document Confirmation Dialog */}
      <Dialog
        open={!!deletingDocument}
        onOpenChange={open => !open && setDeletingDocument(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common:document.deleteTitle', { defaultValue: 'Delete Document?' })}</DialogTitle>
            <DialogDescription>
              {t('common:document.deleteDescription', { defaultValue: 'This action cannot be undone. This will permanently delete this document.' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('common:actions.cancel')}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteDocumentConfirm}
              disabled={deleteDocumentMutation.isPending}
            >
              {deleteDocumentMutation.isPending ? t('common:status.loading') : t('common:actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
};
