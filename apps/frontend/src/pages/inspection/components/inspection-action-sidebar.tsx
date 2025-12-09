import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
  RefreshCw,
  CalendarClockIcon,
  CalendarPlus,
  HistoryIcon,
  ClipboardCheckIcon,
} from 'lucide-react';

import {
  ActionSidebarContainer,
  ActionSidebarGroup,
  DataOptionsSection,
  MenuItemButton,
} from '@/components/sidebar';

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
    <ActionSidebarContainer>
      <ActionSidebarGroup title={t('inspection:sidebar.actions')}>
        <MenuItemButton
          icon={<PlusCircle className="h-4 w-4" />}
          label={t('inspection:actions.createInspection')}
          onClick={handleCreateInspection}
          tooltip={t('inspection:actions.createInspection')}
        />
        <MenuItemButton
          icon={<CalendarPlus className="h-4 w-4" />}
          label={t('inspection:actions.scheduleInspection')}
          onClick={() => navigate('/inspections/schedule')}
          tooltip={t('inspection:actions.scheduleInspection')}
        />
        <MenuItemButton
          icon={<RefreshCw className="h-4 w-4" />}
          label={t('inspection:actions.refreshData')}
          onClick={() => onRefreshData?.()}
          tooltip={t('inspection:actions.refreshData')}
        />
      </ActionSidebarGroup>

      <ActionSidebarGroup title={t('inspection:sidebar.views')} className="mt-4">
        <MenuItemButton
          icon={<ClipboardCheckIcon className="h-4 w-4" />}
          label={t('inspection:sidebar.allInspections')}
          onClick={() => onChangeView('all')}
          tooltip={t('inspection:sidebar.allInspections')}
          className={currentView === 'all' ? 'bg-accent' : ''}
        />
        <MenuItemButton
          icon={<HistoryIcon className="h-4 w-4" />}
          label={t('inspection:sidebar.recentInspections')}
          onClick={() => onChangeView('recent')}
          tooltip={t('inspection:sidebar.recentInspections')}
          className={currentView === 'recent' ? 'bg-accent' : ''}
        />
        <MenuItemButton
          icon={<CalendarClockIcon className="h-4 w-4" />}
          label={t('inspection:sidebar.upcomingInspections')}
          onClick={() => onChangeView('upcoming')}
          tooltip={t('inspection:sidebar.upcomingInspections')}
          className={currentView === 'upcoming' ? 'bg-accent' : ''}
        />
      </ActionSidebarGroup>

      <DataOptionsSection
        i18nNamespace="inspection"
        className="mt-4"
        onPrint={() => window.print()}
      />
    </ActionSidebarContainer>
  );
};
