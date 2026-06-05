import React from 'react';
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
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
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

  const deleteDialog = useDeleteDialog(
    () => deleteInspection.mutateAsync(inspectionId),
    () => navigate(`/hives/${hiveId}`),
  );

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
            onClick={deleteDialog.open}
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

      <DeleteConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.close}
        onConfirm={deleteDialog.handleDelete}
        isPending={deleteDialog.isPending}
        title={t('inspection:detailSidebar.deleteInspection')}
        description={t('common:confirmDelete')}
      />
    </ActionSidebarContainer>
  );
};
