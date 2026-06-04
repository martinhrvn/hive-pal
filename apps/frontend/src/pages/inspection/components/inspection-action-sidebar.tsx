import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
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
import { RefreshButton } from '@/components/sidebar/refresh-button';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';

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
  const { canEdit } = useApiaryPermission();

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
        {canEdit && (
          <MenuItemButton
            icon={<PlusCircle className="h-4 w-4" />}
            label={t('inspection:actions.createInspection')}
            onClick={handleCreateInspection}
            tooltip={t('inspection:actions.createInspection')}
          />
        )}
        {canEdit && (
          <MenuItemButton
            icon={<CalendarPlus className="h-4 w-4" />}
            label={t('inspection:actions.scheduleInspection')}
            onClick={() => navigate('/inspections/schedule')}
            tooltip={t('inspection:actions.scheduleInspection')}
          />
        )}
        <RefreshButton
          onRefresh={onRefreshData}
          i18nNamespace="inspection"
          label={t('inspection:actions.refreshData')}
        />
      </ActionSidebarGroup>

      <ActionSidebarGroup title={t('inspection:sidebar.views')}>
        <MenuItemButton
          icon={<ClipboardCheckIcon className="h-4 w-4" />}
          label={t('inspection:sidebar.allInspections')}
          onClick={() => onChangeView('all')}
          tooltip={t('inspection:sidebar.allInspections')}
          isActive={currentView === 'all'}
        />
        <MenuItemButton
          icon={<HistoryIcon className="h-4 w-4" />}
          label={t('inspection:sidebar.recentInspections')}
          onClick={() => onChangeView('recent')}
          tooltip={t('inspection:sidebar.recentInspections')}
          isActive={currentView === 'recent'}
        />
        <MenuItemButton
          icon={<CalendarClockIcon className="h-4 w-4" />}
          label={t('inspection:sidebar.upcomingInspections')}
          onClick={() => onChangeView('upcoming')}
          tooltip={t('inspection:sidebar.upcomingInspections')}
          isActive={currentView === 'upcoming'}
        />
      </ActionSidebarGroup>

      <DataOptionsSection
        i18nNamespace="inspection"
        onPrint={() => window.print()}
      />
    </ActionSidebarContainer>
  );
};
