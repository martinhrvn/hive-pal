import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
  RefreshCw,
  ClipboardCheck,
  CalendarCheck,
  CalendarPlus,
  Crown,
  Home,
  Bell,
} from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { WeatherForecast } from '@/components/weather';
import { useApiary } from '@/hooks/use-apiary';

interface HomeActionSidebarProps {
  onRefreshData?: () => void;
}

export const HomeActionSidebar: React.FC<HomeActionSidebarProps> = ({
  onRefreshData,
}) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { activeApiaryId } = useApiary();

  return (
    <div className="space-y-4">
      {activeApiaryId && (
        <div className="border rounded-md">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 pt-2">{t('weather.weatherForecast')}</SidebarGroupLabel>
            <WeatherForecast apiaryId={activeApiaryId} />
          </SidebarGroup>
        </div>
      )}
      
      <div className="border rounded-md">
        <div className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel>{t('actions.createNew')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/hives/create/')}
                tooltip={t('actions.newHive')}
              >
                <PlusCircle className="h-4 w-4 text-green-600" />
                <span>{t('actions.newHive')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/inspections/create')}
                tooltip={t('actions.newInspection')}
              >
                <ClipboardCheck className="h-4 w-4 text-blue-600" />
                <span>{t('actions.newInspection')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/inspections/schedule')}
                tooltip={t('actions.scheduleInspection')}
              >
                <CalendarPlus className="h-4 w-4 text-indigo-600" />
                <span>{t('actions.scheduleInspection')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/queens/create')}
                tooltip={t('actions.newQueen')}
              >
                <Crown className="h-4 w-4 text-purple-600" />
                <span>{t('actions.newQueen')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>{t('actions.navigate')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/')}
                tooltip={t('navigation.home')}
                className="bg-accent"
              >
                <Home className="h-4 w-4" />
                <span>{t('navigation.home')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/hives')}
                tooltip={t('navigation.allHives')}
              >
                <Home className="h-4 w-4" />
                <span>{t('navigation.allHives')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/inspections')}
                tooltip={t('navigation.allInspections')}
              >
                <ClipboardCheck className="h-4 w-4" />
                <span>{t('navigation.allInspections')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/inspections/list/recent')}
                tooltip={t('actions.recentInspections')}
              >
                <CalendarCheck className="h-4 w-4" />
                <span>{t('actions.recentInspections')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>{t('actions.actions')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onRefreshData && onRefreshData()}
                tooltip={t('actions.refreshData')}
              >
                <RefreshCw className="h-4 w-4" />
                <span>{t('actions.refreshData')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => alert(t('messages.notificationsComingSoon'))}
                tooltip={`${t('actions.notifications')} (${t('messages.notificationsComingSoon')})`}
              >
                <Bell className="h-4 w-4" />
                <span>{t('actions.notifications')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </div>
      </div>
    </div>
  );
};
