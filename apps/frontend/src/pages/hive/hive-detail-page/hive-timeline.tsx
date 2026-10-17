import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ActionResponse,
  ActionType,
  QuickCheckResponse,
  PhotoResponse,
  DocumentResponse,
} from 'shared-schemas';
import {
  useActions,
  useInspections,
  useDeleteAction,
  useQuickChecks,
  useDeleteQuickCheck,
  usePhotos,
  useDocuments,
  useDeletePhoto,
  useDeleteDocument,
  useUndoSplit,
} from '@/api/hooks';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { Section } from '@/components/common/section';
import { TimelineEventList } from '@/components/common/timeline-event-list';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';
import { EditActionDialog } from './actions/edit-action-dialog';
import { QuickAddMenu } from '@/components/quick-add-menu';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HiveTimelineProps {
  hiveId: string | undefined;
  apiaryId: string | undefined;
}

export const HiveTimeline: React.FC<HiveTimelineProps> = ({
  hiveId,
  apiaryId,
}) => {
  const { t } = useTranslation(['hive', 'common']);
  const navigate = useNavigate();
  const { canEdit } = useApiaryPermission(apiaryId);
  const [editingAction, setEditingAction] = useState<ActionResponse | null>(
    null,
  );
  const [deletingAction, setDeletingAction] = useState<ActionResponse | null>(
    null,
  );
  const [deletingQuickCheck, setDeletingQuickCheck] =
    useState<QuickCheckResponse | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<PhotoResponse | null>(
    null,
  );
  const [deletingDocument, setDeletingDocument] =
    useState<DocumentResponse | null>(null);
  const [undoingSplit, setUndoingSplit] = useState<ActionResponse | null>(null);
  // Set when the plain undo was rejected (409): the daughter already has its
  // own records, so a second, explicit confirmation is required (force).
  const [undoConflict, setUndoConflict] = useState(false);
  const undoSplitMutation = useUndoSplit();
  const deleteActionMutation = useDeleteAction();
  const deleteQuickCheckMutation = useDeleteQuickCheck();
  const deletePhotoMutation = useDeletePhoto();
  const deleteDocumentMutation = useDeleteDocument();

  const { data: inspections, isLoading: inspectionsLoading } = useInspections(
    hiveId ? { hiveId } : undefined,
  );

  const { data: actions, isLoading: actionsLoading } = useActions(
    hiveId ? { hiveId } : undefined,
    { enabled: !!hiveId },
  );

  const { data: quickChecks, isLoading: quickChecksLoading } = useQuickChecks(
    hiveId ? { hiveId } : undefined,
    { enabled: !!hiveId },
  );

  const { data: photos, isLoading: photosLoading } = usePhotos(
    hiveId ? { hiveId } : undefined,
    { enabled: !!hiveId },
  );

  const { data: documents, isLoading: documentsLoading } = useDocuments(
    hiveId ? { hiveId } : undefined,
    { enabled: !!hiveId },
  );

  const getActionWarning = (
    action: ActionResponse,
  ): { message: string; linkTo?: string; linkText?: string } | null => {
    if (action.inspectionId) {
      return {
        message: t('hive:timeline.warnings.inspection'),
        linkTo: `/inspections/${action.inspectionId}`,
        linkText: t('hive:actionDialog.warnings.inspectionLink'),
      };
    }
    if (action.type === ActionType.HARVEST || action.harvestId) {
      return {
        message: t('hive:timeline.warnings.harvest'),
        linkTo: action.harvestId
          ? `/harvests/${action.harvestId}`
          : '/harvests',
        linkText: t('hive:actionDialog.warnings.harvestLink'),
      };
    }
    return null;
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAction) return;
    try {
      await deleteActionMutation.mutateAsync({
        actionId: deletingAction.id,
      });
      toast.success(
        deletingAction.type === ActionType.SPLIT
          ? t('hive:timeline.splitDeleted')
          : t('hive:timeline.actionDeleted'),
      );
      setDeletingAction(null);
    } catch {
      toast.error(t('hive:timeline.actionDeleteFailed'));
    }
  };

  // Resolve the split undo endpoint's inputs from either side of the pair:
  // the endpoint expects the SOURCE (mother) hive id.
  const splitUndoTarget = (action: ActionResponse) => {
    if (action.details.type !== ActionType.SPLIT) return null;
    const { role, counterpartHiveId, splitId } = action.details;
    const sourceHiveId =
      role === 'SOURCE' ? action.hiveId : (counterpartHiveId ?? null);
    const daughterHiveId =
      role === 'NEW' ? action.hiveId : (counterpartHiveId ?? null);
    if (!sourceHiveId || !splitId) return null;
    return { splitId, sourceHiveId, daughterHiveId };
  };

  const handleUndoSplitConfirm = async (force: boolean) => {
    if (!undoingSplit) return;
    const target = splitUndoTarget(undoingSplit);
    if (!target) {
      toast.error(t('hive:timeline.undoSplitUnresolved'));
      setUndoingSplit(null);
      return;
    }
    try {
      await undoSplitMutation.mutateAsync({
        hiveId: target.sourceHiveId,
        splitId: target.splitId,
        force,
      });
      toast.success(t('hive:timeline.splitUndone'));
      setUndoingSplit(null);
      setUndoConflict(false);
      // If we were viewing the daughter, it no longer exists.
      if (hiveId && hiveId === target.daughterHiveId) {
        navigate(`/hives/${target.sourceHiveId}`);
      }
    } catch (e) {
      if (!force && isAxiosError(e) && e.response?.status === 409) {
        setUndoConflict(true);
        return;
      }
      toast.error(t('hive:timeline.undoSplitFailed'));
    }
  };

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
      toast.success(t('common:photo.deleted'));
      setDeletingPhoto(null);
    } catch {
      toast.error(t('common:photo.deleteFailed'));
    }
  };

  const handleDeleteDocumentConfirm = async () => {
    if (!deletingDocument) return;
    try {
      await deleteDocumentMutation.mutateAsync(deletingDocument.id);
      toast.success(t('common:document.deleted'));
      setDeletingDocument(null);
    } catch {
      toast.error(t('common:document.deleteFailed'));
    }
  };

  if (!hiveId) return null;

  return (
    <Section title={t('hive:timeline.title')}>
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
        emptyMessage={t('hive:timeline.empty')}
        handlers={{
          onInspectionClick: inspection =>
            navigate(`/inspections/${inspection.id}`),
          onActionClick: action =>
            action.harvestId
              ? navigate(`/harvests/${action.harvestId}`)
              : undefined,
          ...(canEdit && {
            onEditAction: setEditingAction,
            onDeleteAction: setDeletingAction,
            onUndoSplit: action => {
              setUndoConflict(false);
              setUndoingSplit(action);
            },
            onDeleteQuickCheck: setDeletingQuickCheck,
            onDeletePhoto: setDeletingPhoto,
            onDeleteDocument: setDeletingDocument,
          }),
        }}
      >
        {canEdit && hiveId && apiaryId && (
          <QuickAddMenu apiaryId={apiaryId} hiveId={hiveId} variant="inline" />
        )}
      </TimelineEventList>

      {/* Edit Action Dialog */}
      {editingAction && (
        <EditActionDialog
          action={editingAction}
          open={!!editingAction}
          onOpenChange={open => !open && setEditingAction(null)}
        />
      )}

      {/* Undo Split Confirmation Dialog */}
      <Dialog
        open={!!undoingSplit}
        onOpenChange={open => {
          if (!open) {
            setUndoingSplit(null);
            setUndoConflict(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('hive:timeline.undoSplitDialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('hive:timeline.undoSplitDialog.description')}
            </DialogDescription>
          </DialogHeader>
          {undoConflict && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {t('hive:timeline.undoSplitDialog.conflict')}
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('common:actions.cancel')}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => handleUndoSplitConfirm(undoConflict)}
              disabled={undoSplitMutation.isPending}
            >
              {undoSplitMutation.isPending
                ? t('hive:timeline.undoSplitDialog.undoing')
                : undoConflict
                  ? t('hive:timeline.undoSplitDialog.undoAnyway')
                  : t('common:timeline.undoSplit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Action Confirmation Dialog */}
      <Dialog
        open={!!deletingAction}
        onOpenChange={open => !open && setDeletingAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('hive:timeline.deleteAction.title')}</DialogTitle>
            <DialogDescription>
              {deletingAction?.type === ActionType.SPLIT
                ? t('hive:timeline.deleteAction.splitDescription')
                : t('hive:timeline.deleteAction.description')}
            </DialogDescription>
          </DialogHeader>
          {deletingAction &&
            (() => {
              const warning = getActionWarning(deletingAction);
              return warning ? (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    {warning.message}
                    {warning.linkTo && (
                      <>
                        {' '}
                        <Link
                          to={warning.linkTo}
                          className="underline font-medium hover:text-amber-900"
                        >
                          {warning.linkText}
                        </Link>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              ) : null;
            })()}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('common:actions.cancel')}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteActionMutation.isPending}
            >
              {deleteActionMutation.isPending
                ? t('common:actions.deleting')
                : t('common:actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Button variant="outline">{t('common:actions.cancel')}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteQuickCheckConfirm}
              disabled={deleteQuickCheckMutation.isPending}
            >
              {deleteQuickCheckMutation.isPending
                ? t('common:actions.deleting')
                : t('common:actions.delete')}
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
            <DialogTitle>{t('common:photo.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('common:photo.deleteDescription')}
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
              {deletePhotoMutation.isPending
                ? t('common:actions.deleting')
                : t('common:actions.delete')}
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
            <DialogTitle>{t('common:document.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('common:document.deleteDescription')}
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
              {deleteDocumentMutation.isPending
                ? t('common:actions.deleting')
                : t('common:actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
};
