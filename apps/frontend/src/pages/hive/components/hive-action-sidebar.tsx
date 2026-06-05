import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusCircle, QrCode } from 'lucide-react';

import {
  ActionSidebarContainer,
  ActionSidebarGroup,
  DataOptionsSection,
  MenuItemButton,
  WeatherForecastSection,
} from '@/components/sidebar';
import { RefreshButton } from '@/components/sidebar/refresh-button';
import { useApiary } from '@/hooks/use-apiary';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';

interface HiveActionSidebarProps {
  onRefreshData?: () => void;
}

export const HiveActionSidebar: React.FC<HiveActionSidebarProps> = ({
  onRefreshData,
}) => {
  const { t } = useTranslation(['hive', 'common']);
  const navigate = useNavigate();
  const { activeApiaryId } = useApiary();
  const { canEdit } = useApiaryPermission();

  return (
    <div className="space-y-4">
      <WeatherForecastSection
        apiaryId={activeApiaryId}
        compact
        titleKey="hive:weather.forecast"
      />

      <ActionSidebarContainer>
        <ActionSidebarGroup title={t('common:actions.actions')}>
          {canEdit && (
            <MenuItemButton
              icon={<PlusCircle className="h-4 w-4" />}
              label={t('hive:actions.createNewHive')}
              onClick={() => navigate('/hives/create/')}
              tooltip={t('hive:actions.createNewHive')}
            />
          )}
          <RefreshButton
            onRefresh={onRefreshData}
            i18nNamespace="hive"
            label={t('hive:actions.refreshData')}
          />
        </ActionSidebarGroup>

        <DataOptionsSection
          i18nNamespace="hive"
          additionalItems={
            <MenuItemButton
              icon={<QrCode className="h-4 w-4" />}
              label="Print QR Codes"
              onClick={() => navigate('/hives/qr-codes/print')}
              tooltip="Print QR Codes"
            />
          }
        />
      </ActionSidebarContainer>
    </div>
  );
};
