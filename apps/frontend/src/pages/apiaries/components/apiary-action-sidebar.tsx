import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PencilIcon, PlusCircle, TrashIcon } from 'lucide-react';

import {
  ActionSidebarContainer,
  ActionSidebarGroup,
  DataOptionsSection,
  MenuItemButton,
} from '@/components/sidebar';
import { RefreshButton } from '@/components/sidebar/refresh-button';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { SidebarMenuItem } from '@/components/ui/sidebar';
import { QuickAddMenu } from '@/components/quick-add-menu';
import { useDeleteApiary } from '@/api/hooks/useApiaries';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';

interface ApiaryActionSidebarProps {
  apiaryId?: string;
  onRefreshData?: () => void;
}

export const ApiaryActionSidebar: React.FC<ApiaryActionSidebarProps> = ({
  apiaryId,
  onRefreshData,
}) => {
  const { t } = useTranslation(['apiary', 'common']);
  const navigate = useNavigate();
  const { canEdit } = useApiaryPermission();
  const deleteApiary = useDeleteApiary();

  const deleteDialog = useDeleteDialog(
    () => {
      if (!apiaryId) throw new Error('Apiary ID is required');
      return deleteApiary.mutateAsync(apiaryId);
    },
    () => navigate('/apiaries'),
  );

  return (
    <ActionSidebarContainer>
      <ActionSidebarGroup
        title={t('common:actions.actions', { defaultValue: 'Actions' })}
      >
        {canEdit && (
          <MenuItemButton
            icon={<PlusCircle className="h-4 w-4" />}
            label={t('apiary:create.button')}
            onClick={() => navigate('/apiaries/create/')}
            tooltip={t('apiary:create.button')}
          />
        )}
        {canEdit && apiaryId && (
          <SidebarMenuItem>
            <QuickAddMenu apiaryId={apiaryId} variant="sidebar" />
          </SidebarMenuItem>
        )}
        <RefreshButton
          onRefresh={onRefreshData}
          i18nNamespace="apiary"
          label={t('apiary:actions.refreshData')}
        />
      </ActionSidebarGroup>

      {canEdit && apiaryId && (
        <ActionSidebarGroup
          title={t('apiary:manage.title', { defaultValue: 'Manage Apiary' })}
        >
          <MenuItemButton
            icon={<PencilIcon className="h-4 w-4" />}
            label={t('apiary:edit.title', {
              defaultValue: 'Edit Apiary',
            })}
            onClick={() => navigate(`/apiaries/${apiaryId}/edit`)}
            tooltip={t('apiary:edit.title', {
              defaultValue: 'Edit Apiary',
            })}
          />
          <MenuItemButton
            icon={<TrashIcon className="h-4 w-4" />}
            label={t('apiary:manage.deleteApiary', {
              defaultValue: 'Delete Apiary',
            })}
            onClick={deleteDialog.open}
            tooltip={t('apiary:manage.deleteApiary', {
              defaultValue: 'Delete Apiary',
            })}
          />
        </ActionSidebarGroup>
      )}

      <DataOptionsSection i18nNamespace="apiary" />

      <DeleteConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => !open && deleteDialog.close()}
        onConfirm={deleteDialog.handleDelete}
        isPending={deleteDialog.isPending}
        title={t('apiary:manage.deleteApiary', {
          defaultValue: 'Delete Apiary',
        })}
        description={t('apiary:manage.deleteApiaryConfirmation', {
          defaultValue:
            'Are you sure you want to delete this apiary? All hives and associated data will be permanently deleted. This action cannot be undone.',
        })}
      />
    </ActionSidebarContainer>
  );
};
