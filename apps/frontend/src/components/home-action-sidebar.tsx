import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  PlusCircle,
  ClipboardCheck,
  CalendarCheck,
  CalendarPlus,
  Crown,
  Hexagon,
  Home,
} from 'lucide-react';

import { CalendarSidebar } from '@/components/calendar-sidebar';
import { useApiaryStore } from '@/hooks/use-apiary';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';
import {
  ActionSidebarContainer,
  ActionSidebarGroup,
  MenuItemLink,
  WeatherForecastSection,
} from '@/components/sidebar';
import { RefreshButton } from '@/components/sidebar/refresh-button';

export const HomeActionSidebar: React.FC = () => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const activeApiaryId = useApiaryStore(state => state.activeApiaryId);
  const { canEdit } = useApiaryPermission();

  return (
    <div className="space-y-4">
      <CalendarSidebar />

      <WeatherForecastSection apiaryId={activeApiaryId ?? undefined} />

      <ActionSidebarContainer>
        {canEdit && (
          <ActionSidebarGroup title={t('actions.createNew')}>
            <MenuItemLink
              to="/hives/create"
              icon={<PlusCircle />}
              label={t('actions.newHive')}
            />
            <MenuItemLink
              to="/inspections/create"
              icon={<ClipboardCheck />}
              label={t('actions.newInspection')}
            />
            <MenuItemLink
              to="/inspections/schedule"
              icon={<CalendarPlus />}
              label={t('actions.scheduleInspection')}
            />
            <MenuItemLink
              to="/queens/create"
              icon={<Crown />}
              label={t('actions.newQueen')}
            />
          </ActionSidebarGroup>
        )}

        <ActionSidebarGroup title={t('actions.navigate')}>
          <MenuItemLink
            to="/"
            icon={<Home />}
            label={t('navigation.home')}
            isActive
          />
          <MenuItemLink
            to="/hives"
            icon={<Hexagon />}
            label={t('navigation.allHives')}
          />
          <MenuItemLink
            to="/inspections"
            icon={<ClipboardCheck />}
            label={t('navigation.allInspections')}
          />
          <MenuItemLink
            to="/inspections/list/recent"
            icon={<CalendarCheck />}
            label={t('actions.recentInspections')}
          />
        </ActionSidebarGroup>

        <ActionSidebarGroup title={t('actions.actions')}>
          {/* Refreshes everything on the dashboard (hives, todos, timeline,
              calendar, weather), not just the hive list. */}
          <RefreshButton
            onRefresh={() => void queryClient.invalidateQueries()}
            label={t('actions.refreshData')}
          />
        </ActionSidebarGroup>
      </ActionSidebarContainer>
    </div>
  );
};
