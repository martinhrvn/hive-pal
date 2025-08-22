import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusCircle, RefreshCw, FileDown, Printer, Share2 } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface ApiaryActionSidebarProps {
  onRefreshData?: () => void;
}

export const ApiaryActionSidebar: React.FC<ApiaryActionSidebarProps> = ({
  onRefreshData,
}) => {
  const { t } = useTranslation(['apiary', 'common']);
  const navigate = useNavigate();

  return (
    <div className="border rounded-md">
      <div className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel>{t('common:actions.actions', { defaultValue: 'Actions' })}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/apiaries/create/')}
                tooltip={t('apiary:create.button')}
              >
                <PlusCircle className="h-4 w-4" />
                <span>{t('apiary:create.button')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onRefreshData && onRefreshData()}
                tooltip={t('apiary:actions.refreshData')}
              >
                <RefreshCw className="h-4 w-4" />
                <span>{t('apiary:actions.refreshData')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>{t('apiary:actions.dataOptions')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => alert(t('apiary:messages.exportComingSoon'))}
                tooltip={t('apiary:actions.exportCSV')}
              >
                <FileDown className="h-4 w-4" />
                <span>{t('apiary:actions.exportCSV')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => window.print()}
                tooltip={t('apiary:actions.print')}
              >
                <Printer className="h-4 w-4" />
                <span>{t('apiary:actions.print')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => alert(t('apiary:messages.shareComingSoon'))}
                tooltip={t('apiary:actions.share')}
              >
                <Share2 className="h-4 w-4" />
                <span>{t('apiary:actions.share')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </div>
    </div>
  );
};
