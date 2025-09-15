import React, { useState } from 'react';
import {
  useCurrentWeather,
  useWeatherHourlyForecast,
  useWeatherDailyForecast,
} from '@/api/hooks/useWeather';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  CloudDrizzle,
  CloudFog,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { WeatherCondition } from 'shared-schemas';
import { useUnitFormat } from '@/hooks/use-unit-format';

interface WeatherForecastProps {
  apiaryId: string | undefined;
  compact?: boolean;
  showHourly?: boolean;
}

const getWeatherIcon = (
  condition: WeatherCondition,
  size: 'sm' | 'md' | 'lg' = 'md',
) => {
  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size];

  switch (condition) {
    case 'CLEAR':
      return <Sun className={sizeClass} />;
    case 'PARTLY_CLOUDY':
    case 'OVERCAST':
      return <Cloud className={sizeClass} />;
    case 'RAIN':
      return <CloudRain className={sizeClass} />;
    case 'DRIZZLE':
      return <CloudDrizzle className={sizeClass} />;
    case 'SNOW':
      return <CloudSnow className={sizeClass} />;
    case 'FOG':
      return <CloudFog className={sizeClass} />;
    default:
      return <Cloud className={sizeClass} />;
  }
};

const formatDate = (dateString: string, t: (key: string) => string) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return t('time.today');
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return t('time.tomorrow');
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
};

export const WeatherForecast: React.FC<WeatherForecastProps> = ({
  apiaryId,
  showHourly = true,
}) => {
  const { t } = useTranslation('common');
  const { formatSpeed, formatTemperature } = useUnitFormat();
  const [showHourlyForecast, setShowHourlyForecast] = useState(false);
  const [showDailyForecast, setShowDailyForecast] = useState(false);
  const {
    data: currentWeather,
    isLoading: loadingCurrent,
    error: currentError,
  } = useCurrentWeather(apiaryId || '', { enabled: !!apiaryId });

  const {
    data: hourlyForecast,
    isLoading: loadingHourly,
    error: hourlyError,
  } = useWeatherHourlyForecast(apiaryId || '', {
    enabled: !!apiaryId && showHourly,
  });

  const {
    data: dailyForecast,
    isLoading: loadingDaily,
    error: dailyError,
  } = useWeatherDailyForecast(apiaryId || '', { enabled: !!apiaryId });

  if (!apiaryId) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {t('weather.selectHiveToView')}
      </div>
    );
  }

  if (loadingCurrent || loadingHourly || loadingDaily) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-20 w-full" />
        {showHourly && <Skeleton className="h-24 w-full" />}
      </div>
    );
  }

  if (currentError || hourlyError || dailyError) {
    return (
      <Alert className="m-4">
        <AlertDescription>{t('weather.unableToLoad')}</AlertDescription>
      </Alert>
    );
  }

  if (!currentWeather && !hourlyForecast && !dailyForecast) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {t('weather.noWeatherData')}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {currentWeather && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">
            {t('weather.currentWeather')}
          </h3>
          <div className="flex items-center justify-between p-3 bg-accent rounded-md">
            <div className="flex items-center gap-3">
              {getWeatherIcon(currentWeather.condition)}
              <div>
                <div className="font-semibold text-lg">
                  {formatTemperature(currentWeather.temperature).label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('weather.feelsLike', {
                    temperature: formatTemperature(currentWeather.feelsLike).value,
                  })}
                </div>
              </div>
            </div>
            <div className="text-right text-xs">
              <div>
                {t('weather.humidity')}: {currentWeather.humidity}%
              </div>
              <div>
                {t('weather.wind')}: {formatSpeed(currentWeather.windSpeed).label}
              </div>
            </div>
          </div>
        </div>
      )}

      {showHourly && hourlyForecast && hourlyForecast.length > 0 && (
        <Collapsible
          open={showHourlyForecast}
          onOpenChange={setShowHourlyForecast}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md transition-colors">
            <h3 className="text-sm font-semibold">{t('weather.nextHours')}</h3>
            {showHourlyForecast ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="overflow-x-auto">
              <div className="flex gap-2 pb-2">
                {hourlyForecast.slice(0, 5).map(hour => (
                  <div
                    key={hour.id}
                    className="flex-none w-16 h-20 bg-accent rounded-lg p-2 flex flex-col items-center justify-between hover:bg-accent/80 transition-colors"
                  >
                    <div className="text-xs text-muted-foreground text-center leading-tight">
                      {new Date(hour.timestamp)
                        .toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          hour12: false,
                        })
                        .replace(':00', '')}
                    </div>
                    <div className="flex-1 flex items-center">
                      {getWeatherIcon(hour.condition, 'sm')}
                    </div>
                    <div className="text-xs font-medium text-center">
                      {formatTemperature(hour.temperature).value.toFixed(0)}°
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {dailyForecast && dailyForecast.length > 0 && (
        <Collapsible
          open={showDailyForecast}
          onOpenChange={setShowDailyForecast}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md transition-colors">
            <h3 className="text-sm font-semibold">
              {t('weather.dayForecast')}
            </h3>
            {showDailyForecast ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="overflow-x-auto">
              <div className="flex gap-2 pb-2">
                {dailyForecast.slice(0, 7).map(day => (
                  <div
                    key={day.id}
                    className="flex-none w-16 h-24 bg-accent rounded-lg p-2 flex flex-col items-center justify-between hover:bg-accent/80 transition-colors"
                  >
                    <div className="text-xs text-muted-foreground text-center leading-tight">
                      {formatDate(day.date, t).split(' ').slice(0, 1).join(' ')}
                    </div>
                    <div className="flex-1 flex items-center">
                      {getWeatherIcon(day.condition, 'sm')}
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium">
                        {formatTemperature(day.temperatureMax).value.toFixed(0)}°
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTemperature(day.temperatureMin).value.toFixed(0)}°
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
