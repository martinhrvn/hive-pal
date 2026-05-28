import React from 'react';
import { useTranslation } from 'react-i18next';

import { WeatherForecast } from '@/components/weather';
import { ActionSidebarContainer } from './action-sidebar-section';

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
    <ActionSidebarContainer>
      <div className="px-3 py-3">
        <h3 className="font-overline text-stone-500 dark:text-stone-400 mb-2 px-2">
          {t(titleKey)}
        </h3>
        <WeatherForecast apiaryId={apiaryId} compact={compact} />
      </div>
    </ActionSidebarContainer>
  );
};
