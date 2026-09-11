import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
  Pencil,
  Trash,
  ArrowLeft,
  Home,
  ClipboardList,
  CalendarRange,
  Printer,
} from 'lucide-react';

import {
  ActionSidebarContainer,
  ActionSidebarGroup,
  MenuItemButton,
} from '@/components/sidebar';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';
import { useDeleteInspection, useInspection } from '@/api/hooks/useInspections';
import { useHiveApiaryLookup } from '@/api/hooks/useHives';
import { ActionType } from 'shared-schemas';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface InspectionDetailSidebarProps {
  inspectionId: string;
  hiveId: string;
}

export const InspectionDetailSidebar: React.FC<
  InspectionDetailSidebarProps
> = ({ inspectionId, hiveId }) => {
  const { t } = useTranslation(['inspection', 'common']);
  const navigate = useNavigate();
  const { canEdit } = useApiaryPermission();
  const deleteInspection = useDeleteInspection();
  const lookupApiaryId = useHiveApiaryLookup();
  const { data: inspection } = useInspection(inspectionId, {
    enabled: !!inspectionId,
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Net frames added (+) / removed (-) by this inspection's frame actions
  const frameDelta = (inspection?.actions ?? []).reduce(
    (sum, action) =>
      action.details.type === ActionType.FRAME
        ? sum + action.details.quantity
        : sum,
    0,
  );
  const hasFrameModification = frameDelta !== 0;

  const handleDelete = async (revertFrames = false) => {
    try {
      await deleteInspection.mutateAsync({
        id: inspectionId,
        revertFrames,
        apiaryId: lookupApiaryId(hiveId),
      });
      setShowDeleteDialog(false);
      navigate(`/hives/${hiveId}`);
    } catch (error) {
      console.error('Failed to delete inspection:', error);
    }
  };

  return (
    <ActionSidebarContainer>
      <ActionSidebarGroup
        title={t('inspection:detailSidebar.inspectionActions')}
      >
        {canEdit && (
          <MenuItemButton
            icon={<Pencil className="h-4 w-4" />}
            label={t('inspection:detailSidebar.editInspection')}
            onClick={() => navigate(`/inspections/${inspectionId}/edit`)}
            tooltip={t('inspection:detailSidebar.editInspection')}
          />
        )}
        <MenuItemButton
          icon={<Printer className="h-4 w-4" />}
          label={t('inspection:detailSidebar.printDetails')}
          onClick={() => window.print()}
          tooltip={t('inspection:detailSidebar.printDetails')}
        />
        {canEdit && (
          <MenuItemButton
            icon={<Trash className="h-4 w-4" />}
            label={t('inspection:detailSidebar.deleteInspection')}
            onClick={() => setShowDeleteDialog(true)}
            tooltip={t('inspection:detailSidebar.deleteInspection')}
            className="text-red-600 hover:text-red-700"
          />
        )}
      </ActionSidebarGroup>

      <ActionSidebarGroup title={t('inspection:detailSidebar.relatedActions')}>
        <MenuItemButton
          icon={<Home className="h-4 w-4" />}
          label={t('inspection:detailSidebar.viewHive')}
          onClick={() => navigate(`/hives/${hiveId}`)}
          tooltip={t('inspection:detailSidebar.viewHive')}
        />
        {canEdit && (
          <MenuItemButton
            icon={<PlusCircle className="h-4 w-4" />}
            label={t('inspection:detailSidebar.newInspection')}
            onClick={() => navigate(`/hives/${hiveId}/inspections/create`)}
            tooltip={t('inspection:detailSidebar.newInspection')}
          />
        )}
      </ActionSidebarGroup>

      <ActionSidebarGroup title={t('inspection:detailSidebar.navigation')}>
        <MenuItemButton
          icon={<ClipboardList className="h-4 w-4" />}
          label={t('inspection:detailSidebar.allInspections')}
          onClick={() => navigate('/inspections')}
          tooltip={t('inspection:detailSidebar.allInspections')}
        />
        <MenuItemButton
          icon={<CalendarRange className="h-4 w-4" />}
          label={t('inspection:detailSidebar.recentInspections')}
          onClick={() => navigate('/inspections/list/recent')}
          tooltip={t('inspection:detailSidebar.recentInspections')}
        />
        <MenuItemButton
          icon={<ArrowLeft className="h-4 w-4" />}
          label={t('inspection:detailSidebar.goBack')}
          onClick={() => navigate(-1)}
          tooltip={t('inspection:detailSidebar.goBack')}
        />
      </ActionSidebarGroup>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('inspection:detailSidebar.deleteInspection')}
            </DialogTitle>
            <DialogDescription>
              {hasFrameModification
                ? `${t(
                    frameDelta > 0
                      ? 'inspection:detailSidebar.frameModificationAdded'
                      : 'inspection:detailSidebar.frameModificationRemoved',
                    { count: Math.abs(frameDelta) },
                  )} ${t('inspection:detailSidebar.frameModificationQuestion')}`
                : t('common:confirmDelete')}
            </DialogDescription>
          </DialogHeader>
          {hasFrameModification ? (
            <DialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
              <Button
                onClick={() => handleDelete(false)}
                variant="destructive"
                className="w-full"
                disabled={deleteInspection.isPending}
              >
                {t('inspection:detailSidebar.deleteKeepFrames')}
              </Button>
              <Button
                onClick={() => handleDelete(true)}
                variant="destructive"
                className="w-full"
                disabled={deleteInspection.isPending}
              >
                {t('inspection:detailSidebar.deleteRevertFrames')}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowDeleteDialog(false)}
              >
                {t('common:actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                {t('common:actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                onClick={() => handleDelete(false)}
                variant="destructive"
                disabled={deleteInspection.isPending}
              >
                {deleteInspection.isPending
                  ? t('common:actions.deleting', {
                      defaultValue: 'Deleting...',
                    })
                  : t('common:actions.delete', { defaultValue: 'Delete' })}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </ActionSidebarContainer>
  );
};
