import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
  ClipboardCheck,
  CalendarCheck,
  CalendarPlus,
  Crown,
  Home,
  Bell,
} from 'lucide-react';

import { CalendarSidebar } from '@/components/calendar-sidebar';
import { useApiary } from '@/hooks/use-apiary';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';
import {
  ActionSidebarContainer,
  ActionSidebarGroup,
  MenuItemButton,
  WeatherForecastSection,
} from '@/components/sidebar';
import { RefreshButton } from '@/components/sidebar/refresh-button';

interface HomeActionSidebarProps {
  onRefreshData?: () => void;
}

export const HomeActionSidebar: React.FC<HomeActionSidebarProps> = ({
  onRefreshData,
}) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { activeApiaryId } = useApiary();
  const { canEdit } = useApiaryPermission();

  return (
    <div className="space-y-4">
      <CalendarSidebar />

      <WeatherForecastSection apiaryId={activeApiaryId ?? undefined} />

      <ActionSidebarContainer>
        {canEdit && (
          <ActionSidebarGroup title={t('actions.createNew')}>
            <MenuItemButton
              icon={<PlusCircle className="h-4 w-4 text-green-600" />}
              label={t('actions.newHive')}
              onClick={() => navigate('/hives/create/')}
              tooltip={t('actions.newHive')}
            />
            <MenuItemButton
              icon={<ClipboardCheck className="h-4 w-4 text-blue-600" />}
              label={t('actions.newInspection')}
              onClick={() => navigate('/inspections/create')}
              tooltip={t('actions.newInspection')}
            />
            <MenuItemButton
              icon={<CalendarPlus className="h-4 w-4 text-indigo-600" />}
              label={t('actions.scheduleInspection')}
              onClick={() => navigate('/inspections/schedule')}
              tooltip={t('actions.scheduleInspection')}
            />
            <MenuItemButton
              icon={<Crown className="h-4 w-4 text-purple-600" />}
              label={t('actions.newQueen')}
              onClick={() => navigate('/queens/create')}
              tooltip={t('actions.newQueen')}
            />
          </ActionSidebarGroup>
        )}

        <ActionSidebarGroup title={t('actions.navigate')}>
          <MenuItemButton
            icon={<Home className="h-4 w-4" />}
            label={t('navigation.home')}
            onClick={() => navigate('/')}
            tooltip={t('navigation.home')}
            isActive
          />
          <MenuItemButton
            icon={<Home className="h-4 w-4" />}
            label={t('navigation.allHives')}
            onClick={() => navigate('/hives')}
            tooltip={t('navigation.allHives')}
          />
          <MenuItemButton
            icon={<ClipboardCheck className="h-4 w-4" />}
            label={t('navigation.allInspections')}
            onClick={() => navigate('/inspections')}
            tooltip={t('navigation.allInspections')}
          />
          <MenuItemButton
            icon={<CalendarCheck className="h-4 w-4" />}
            label={t('actions.recentInspections')}
            onClick={() => navigate('/inspections/list/recent')}
            tooltip={t('actions.recentInspections')}
          />
        </ActionSidebarGroup>

        <ActionSidebarGroup title={t('actions.actions')}>
          <RefreshButton
            onRefresh={onRefreshData}
            i18nNamespace="common"
            label={t('actions.refreshData')}
          />
          <MenuItemButton
            icon={<Bell className="h-4 w-4" />}
            label={t('actions.notifications')}
            onClick={() => alert(t('messages.notificationsComingSoon'))}
            tooltip={`${t('actions.notifications')} (${t('messages.notificationsComingSoon')})`}
          />
        </ActionSidebarGroup>
      </ActionSidebarContainer>
    </div>
  );
};
