import React, { useState } from 'react';
import { useNavigate } from 'react-router';
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
  MenuItemLink,
} from '@/components/sidebar';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';
import { useDeleteInspection, useInspection } from '@/api/hooks/useInspections';
import { useHive, useHiveApiaryLookup } from '@/api/hooks/useHives';
import { DeleteInspectionDialog } from './delete-inspection-dialog';

interface InspectionDetailSidebarProps {
  inspectionId: string;
  hiveId: string;
}

export const InspectionDetailSidebar: React.FC<
  InspectionDetailSidebarProps
> = ({ inspectionId, hiveId }) => {
  const { t } = useTranslation(['inspection', 'common']);
  const navigate = useNavigate();
  const { data: hive } = useHive(hiveId, { enabled: !!hiveId });
  // Permissions follow the inspection's hive's apiary, not the selected one.
  const { canEdit } = useApiaryPermission(hive?.apiaryId);
  const deleteInspection = useDeleteInspection();
  const lookupApiaryId = useHiveApiaryLookup();
  const { data: inspection } = useInspection(inspectionId, {
    enabled: !!inspectionId,
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async (revertHiveChanges: boolean) => {
    try {
      await deleteInspection.mutateAsync({
        id: inspectionId,
        revertHiveChanges,
        apiaryId: lookupApiaryId(hiveId),
      });
      setShowDeleteDialog(false);
      navigate(`/hives/${hiveId}`);
    } catch {
      // useDeleteInspection already shows an error toast
    }
  };

  return (
    <ActionSidebarContainer>
      <ActionSidebarGroup
        title={t('inspection:detailSidebar.inspectionActions')}
      >
        {canEdit && (
          <MenuItemLink
            icon={<Pencil />}
            label={t('inspection:detailSidebar.editInspection')}
            to={`/inspections/${inspectionId}/edit`}
          />
        )}
        <MenuItemButton
          icon={<Printer />}
          label={t('inspection:detailSidebar.printDetails')}
          onClick={() => window.print()}
        />
        {canEdit && (
          <MenuItemButton
            icon={<Trash />}
            label={t('inspection:detailSidebar.deleteInspection')}
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive"
          />
        )}
      </ActionSidebarGroup>

      <ActionSidebarGroup title={t('inspection:detailSidebar.relatedActions')}>
        <MenuItemLink
          icon={<Home />}
          label={t('inspection:detailSidebar.viewHive')}
          to={`/hives/${hiveId}`}
        />
        {canEdit && (
          <MenuItemLink
            icon={<PlusCircle />}
            label={t('inspection:detailSidebar.newInspection')}
            to={`/hives/${hiveId}/inspections/create`}
          />
        )}
      </ActionSidebarGroup>

      <ActionSidebarGroup title={t('inspection:detailSidebar.navigation')}>
        <MenuItemLink
          icon={<ClipboardList />}
          label={t('inspection:detailSidebar.allInspections')}
          to="/inspections"
        />
        <MenuItemLink
          icon={<CalendarRange />}
          label={t('inspection:detailSidebar.recentInspections')}
          to="/inspections/list/recent"
        />
        <MenuItemButton
          icon={<ArrowLeft />}
          label={t('inspection:detailSidebar.goBack')}
          onClick={() => navigate(-1)}
        />
      </ActionSidebarGroup>

      <DeleteInspectionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        actions={inspection?.actions ?? []}
        hiveBoxes={hive?.boxes}
        isPending={deleteInspection.isPending}
        onDelete={revert => void handleDelete(revert)}
      />
    </ActionSidebarContainer>
  );
};
