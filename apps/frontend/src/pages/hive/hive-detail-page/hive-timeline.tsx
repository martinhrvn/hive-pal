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
} from '@/api/hooks';
import { toast } from 'sonner';
import { Section } from '@/components/common/section';
import { TimelineEventList } from '@/components/common/timeline-event-list';
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

interface HiveTimelineProps {
  hiveId: string | undefined;
  apiaryId: string | undefined;
}

export const HiveTimeline: React.FC<HiveTimelineProps> = ({
  hiveId,
  apiaryId,
}) => {
  const navigate = useNavigate();
  const [editingAction, setEditingAction] = useState<ActionResponse | null>(
    null,
  );
  const [deletingAction, setDeletingAction] = useState<ActionResponse | null>(
    null,
  );
  const [deletingQuickCheck, setDeletingQuickCheck] =
    useState<QuickCheckResponse | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<PhotoResponse | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<DocumentResponse | null>(null);
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
        message:
          'This action is part of an inspection. Modifying it here will cause it to be out of sync with the inspection record.',
        linkTo: `/inspections/${action.inspectionId}`,
        linkText: 'Edit inspection instead',
      };
    }
    if (action.type === ActionType.HARVEST || action.harvestId) {
      return {
        message:
          'This action is linked to a harvest. Modifying it here will cause it to be out of sync with the harvest record.',
        linkTo: action.harvestId
          ? `/harvests/${action.harvestId}`
          : '/harvests',
        linkText: 'Go to harvest',
      };
    }
    return null;
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAction) return;
    try {
      await deleteActionMutation.mutateAsync(deletingAction.id);
      toast.success('Action deleted');
      setDeletingAction(null);
    } catch {
      toast.error('Failed to delete action');
    }
  };

  const handleDeleteQuickCheckConfirm = async () => {
    if (!deletingQuickCheck) return;
    try {
      await deleteQuickCheckMutation.mutateAsync(deletingQuickCheck.id);
      toast.success('Quick check deleted');
      setDeletingQuickCheck(null);
    } catch {
      toast.error('Failed to delete quick check');
    }
  };

  const handleDeletePhotoConfirm = async () => {
    if (!deletingPhoto) return;
    try {
      await deletePhotoMutation.mutateAsync(deletingPhoto.id);
      toast.success('Photo deleted');
      setDeletingPhoto(null);
    } catch {
      toast.error('Failed to delete photo');
    }
  };

  const handleDeleteDocumentConfirm = async () => {
    if (!deletingDocument) return;
    try {
      await deleteDocumentMutation.mutateAsync(deletingDocument.id);
      toast.success('Document deleted');
      setDeletingDocument(null);
    } catch {
      toast.error('Failed to delete document');
    }
  };

  if (!hiveId) return null;

  return (
    <Section title="Activity Timeline">
      <TimelineEventList
        inspections={inspections ?? []}
        actions={actions ?? []}
        quickChecks={quickChecks ?? []}
        photos={photos ?? []}
        documents={documents ?? []}
        isLoading={inspectionsLoading || actionsLoading || quickChecksLoading || photosLoading || documentsLoading}
        emptyMessage="No activity recorded for this hive yet"
        onEditAction={setEditingAction}
        onDeleteAction={setDeletingAction}
        onDeleteQuickCheck={setDeletingQuickCheck}
        onDeletePhoto={setDeletingPhoto}
        onDeleteDocument={setDeletingDocument}
        onInspectionClick={inspection =>
          navigate(`/inspections/${inspection.id}`)
        }
        onActionClick={action =>
          action.harvestId
            ? navigate(`/harvests/${action.harvestId}`)
            : undefined
        }
        headerSlot={
          hiveId && apiaryId ? (
            <QuickAddMenu apiaryId={apiaryId} hiveId={hiveId} variant="inline" />
          ) : undefined
        }
      />

      {/* Edit Action Dialog */}
      {editingAction && (
        <EditActionDialog
          action={editingAction}
          open={!!editingAction}
          onOpenChange={open => !open && setEditingAction(null)}
        />
      )}

      {/* Delete Action Confirmation Dialog */}
      <Dialog
        open={!!deletingAction}
        onOpenChange={open => !open && setDeletingAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Action?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete this
              action.
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
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteActionMutation.isPending}
            >
              {deleteActionMutation.isPending ? 'Deleting...' : 'Delete'}
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
            <DialogTitle>Delete Quick Check?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete this
              quick check and its photos.
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
              {deleteQuickCheckMutation.isPending ? 'Deleting...' : 'Delete'}
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
            <DialogTitle>Delete Photo?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete this photo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeletePhotoConfirm}
              disabled={deletePhotoMutation.isPending}
            >
              {deletePhotoMutation.isPending ? 'Deleting...' : 'Delete'}
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
            <DialogTitle>Delete Document?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete this document.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteDocumentConfirm}
              disabled={deleteDocumentMutation.isPending}
            >
              {deleteDocumentMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
};
