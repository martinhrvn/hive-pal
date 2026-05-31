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

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ActionSidebarContainer,
  ActionSidebarGroup,
  MenuItemButton,
} from '@/components/sidebar';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';
import { useDeleteInspection } from '@/api/hooks/useInspections';

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteInspection.mutateAsync(inspectionId);
      setShowDeleteDialog(false);
      navigate(`/hives/${hiveId}`);
    } catch (error) {
      console.error('Failed to delete inspection:', error);
    }
  };

  return (
    <ActionSidebarContainer>
      <ActionSidebarGroup title={t('inspection:detailSidebar.inspectionActions')}>
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
              {t('common:confirmDelete')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              {t('common:actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              disabled={deleteInspection.isPending}
            >
              {deleteInspection.isPending
                ? t('common:actions.deleting', { defaultValue: 'Deleting...' })
                : t('common:actions.delete', { defaultValue: 'Delete' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ActionSidebarContainer>
  );
};
