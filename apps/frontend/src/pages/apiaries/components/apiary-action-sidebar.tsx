import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusCircle, RefreshCw } from 'lucide-react';

import {
  ActionSidebarContainer,
  ActionSidebarGroup,
  DataOptionsSection,
  MenuItemButton,
} from '@/components/sidebar';

interface ApiaryActionSidebarProps {
  onRefreshData?: () => void;
}

export const ApiaryActionSidebar: React.FC<ApiaryActionSidebarProps> = ({
  onRefreshData,
}) => {
  const { t } = useTranslation(['apiary', 'common']);
  const navigate = useNavigate();

  return (
    <ActionSidebarContainer>
      <ActionSidebarGroup
        title={t('common:actions.actions', { defaultValue: 'Actions' })}
      >
        <MenuItemButton
          icon={<PlusCircle className="h-4 w-4" />}
          label={t('apiary:create.button')}
          onClick={() => navigate('/apiaries/create/')}
          tooltip={t('apiary:create.button')}
        />
        <MenuItemButton
          icon={<RefreshCw className="h-4 w-4" />}
          label={t('apiary:actions.refreshData')}
          onClick={() => onRefreshData?.()}
          tooltip={t('apiary:actions.refreshData')}
        />
      </ActionSidebarGroup>

      <DataOptionsSection i18nNamespace="apiary" className="mt-4" />
    </ActionSidebarContainer>
  );
};
