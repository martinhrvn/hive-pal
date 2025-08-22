import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
  RefreshCw,
  FileDown,
  Printer,
  Share2,
  CalendarClockIcon,
  CalendarPlus,
  HistoryIcon,
  ClipboardCheckIcon,
} from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface InspectionActionSidebarProps {
  onRefreshData?: () => void;
  selectedHiveId?: string;
  onChangeView: (view: string) => void;
  currentView: string;
}

export const InspectionActionSidebar: React.FC<
  InspectionActionSidebarProps
> = ({ onRefreshData, selectedHiveId, onChangeView, currentView }) => {
  const { t } = useTranslation(['inspection', 'common']);
  const navigate = useNavigate();

  const handleCreateInspection = () => {
    navigate(
      selectedHiveId && selectedHiveId !== 'all'
        ? `/hives/${selectedHiveId}/inspections/create`
        : '/inspections/create',
    );
  };

  return (
    <div className="border rounded-md">
      <div className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel>{t('inspection:sidebar.actions')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleCreateInspection}
                tooltip={t('inspection:actions.createInspection')}
              >
                <PlusCircle className="h-4 w-4" />
                <span>{t('inspection:actions.createInspection')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/inspections/schedule')}
                tooltip={t('inspection:actions.scheduleInspection')}
              >
                <CalendarPlus className="h-4 w-4" />
                <span>{t('inspection:actions.scheduleInspection')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onRefreshData && onRefreshData()}
                tooltip={t('inspection:actions.refreshData')}
              >
                <RefreshCw className="h-4 w-4" />
                <span>{t('inspection:actions.refreshData')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>{t('inspection:sidebar.views')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onChangeView('all')}
                tooltip={t('inspection:sidebar.allInspections')}
                className={currentView === 'all' ? 'bg-accent' : ''}
              >
                <ClipboardCheckIcon className="h-4 w-4" />
                <span>{t('inspection:sidebar.allInspections')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onChangeView('recent')}
                tooltip={t('inspection:sidebar.recentInspections')}
                className={currentView === 'recent' ? 'bg-accent' : ''}
              >
                <HistoryIcon className="h-4 w-4" />
                <span>{t('inspection:sidebar.recentInspections')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onChangeView('upcoming')}
                tooltip={t('inspection:sidebar.upcomingInspections')}
                className={currentView === 'upcoming' ? 'bg-accent' : ''}
              >
                <CalendarClockIcon className="h-4 w-4" />
                <span>{t('inspection:sidebar.upcomingInspections')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>{t('inspection:actions.dataOptions')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => alert(t('inspection:messages.exportComingSoon'))}
                tooltip={t('inspection:actions.exportCSV')}
              >
                <FileDown className="h-4 w-4" />
                <span>{t('inspection:actions.exportCSV')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => window.print()}
                tooltip={t('inspection:sidebar.printInspectionList')}
              >
                <Printer className="h-4 w-4" />
                <span>{t('inspection:actions.printList')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => alert(t('inspection:messages.shareComingSoon'))}
                tooltip={t('inspection:sidebar.shareInspectionList')}
              >
                <Share2 className="h-4 w-4" />
                <span>{t('inspection:actions.shareList')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </div>
    </div>
  );
};
