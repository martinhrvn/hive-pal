import React from 'react';
import { useTranslation } from 'react-i18next';

import { SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { WeatherForecast } from '@/components/weather';

interface WeatherForecastSectionProps {
  apiaryId?: string;
  compact?: boolean;
  titleKey?: string;
}

export const WeatherForecastSection: React.FC<WeatherForecastSectionProps> = ({
  apiaryId,
  compact = false,
  titleKey = 'common:weather.weatherForecast',
}) => {
  const { t } = useTranslation();

  if (!apiaryId) return null;

  return (
    <div className="border rounded-md">
      <SidebarGroup>
        <SidebarGroupLabel className="px-2 pt-2">
          {t(titleKey)}
        </SidebarGroupLabel>
        <WeatherForecast apiaryId={apiaryId} compact={compact} />
      </SidebarGroup>
    </div>
  );
};
