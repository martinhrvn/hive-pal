import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PencilIcon, PlusCircle, RefreshCw, TrashIcon } from 'lucide-react';

import {
  ActionSidebarContainer,
  ActionSidebarGroup,
  DataOptionsSection,
  MenuItemButton,
} from '@/components/sidebar';
import { SidebarMenuItem } from '@/components/ui/sidebar';
import { QuickAddMenu } from '@/components/quick-add-menu';
import { useDeleteApiary } from '@/api/hooks/useApiaries';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    if (!apiaryId) return;
    try {
      await deleteApiary.mutateAsync(apiaryId);
      setShowDeleteDialog(false);
      navigate('/apiaries');
    } catch (error) {
      console.error('Failed to delete apiary:', error);
    }
  };

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
        <MenuItemButton
          icon={<RefreshCw className="h-4 w-4" />}
          label={t('apiary:actions.refreshData')}
          onClick={() => onRefreshData?.()}
          tooltip={t('apiary:actions.refreshData')}
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
            onClick={() => setShowDeleteDialog(true)}
            tooltip={t('apiary:manage.deleteApiary', {
              defaultValue: 'Delete Apiary',
            })}
          />
        </ActionSidebarGroup>
      )}

      <DataOptionsSection i18nNamespace="apiary" />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('apiary:manage.deleteApiary', {
                defaultValue: 'Delete Apiary',
              })}
            </DialogTitle>
            <DialogDescription>
              {t('apiary:manage.deleteApiaryConfirmation', {
                defaultValue:
                  'Are you sure you want to delete this apiary? All hives and associated data will be permanently deleted. This action cannot be undone.',
              })}
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
              disabled={deleteApiary.isPending}
            >
              {deleteApiary.isPending
                ? t('common:actions.deleting', { defaultValue: 'Deleting...' })
                : t('common:actions.delete', { defaultValue: 'Delete' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ActionSidebarContainer>
  );
};
