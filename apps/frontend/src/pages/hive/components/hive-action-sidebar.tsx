import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
  RefreshCw,
  FileDown,
  Printer,
  Share2,
  QrCode,
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

interface HiveActionSidebarProps {
  onRefreshData?: () => void;
}

export const HiveActionSidebar: React.FC<HiveActionSidebarProps> = ({
  onRefreshData,
}) => {
  const { t } = useTranslation(['hive', 'common']);
  const navigate = useNavigate();
  const { activeApiaryId } = useApiary();

  return (
    <div className="space-y-4">
      {activeApiaryId && (
        <div className="border rounded-md">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 pt-2">
              {t('hive:weather.forecast')}
            </SidebarGroupLabel>
            <WeatherForecast apiaryId={activeApiaryId} compact />
          </SidebarGroup>
        </div>
      )}

      <div className="border rounded-md">
        <div className="p-2">
          <SidebarGroup>
            <SidebarGroupLabel>{t('common:actions.actions')}</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/hives/create/')}
                  tooltip={t('hive:actions.createNewHive')}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>{t('hive:actions.createNewHive')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onRefreshData && onRefreshData()}
                  tooltip={t('hive:actions.refreshData')}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>{t('hive:actions.refreshData')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="mt-4">
            <SidebarGroupLabel>
              {t('hive:actions.dataOptions')}
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => alert(t('hive:messages.exportComingSoon'))}
                  tooltip={t('hive:actions.exportCSV')}
                >
                  <FileDown className="h-4 w-4" />
                  <span>{t('hive:actions.exportCSV')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => window.print()}
                  tooltip={t('hive:actions.print')}
                >
                  <Printer className="h-4 w-4" />
                  <span>{t('hive:actions.print')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/hives/qr-codes/print')}
                  tooltip="Print QR Codes"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Print QR Codes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => alert(t('hive:messages.shareComingSoon'))}
                  tooltip={t('hive:actions.share')}
                >
                  <Share2 className="h-4 w-4" />
                  <span>{t('hive:actions.share')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </div>
      </div>
    </div>
  );
};
