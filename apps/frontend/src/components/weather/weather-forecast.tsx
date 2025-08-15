import React from 'react';
import { 
  useCurrentWeather, 
  useWeatherHourlyForecast, 
  useWeatherDailyForecast 
} from '@/api/hooks/useWeather';
import { Cloud, CloudRain, CloudSnow, Sun, CloudDrizzle, CloudFog } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WeatherCondition } from 'shared-schemas';

interface WeatherForecastProps {
  apiaryId: string | undefined;
  compact?: boolean;
  showHourly?: boolean;
}

const getWeatherIcon = (condition: WeatherCondition) => {
  const iconClass = "h-5 w-5";
  switch (condition) {
    case 'CLEAR':
      return <Sun className={iconClass} />;
    case 'PARTLY_CLOUDY':
    case 'OVERCAST':
      return <Cloud className={iconClass} />;
    case 'RAIN':
      return <CloudRain className={iconClass} />;
    case 'DRIZZLE':
      return <CloudDrizzle className={iconClass} />;
    case 'SNOW':
      return <CloudSnow className={iconClass} />;
    case 'FOG':
      return <CloudFog className={iconClass} />;
    default:
      return <Cloud className={iconClass} />;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
};

export const WeatherForecast: React.FC<WeatherForecastProps> = ({ 
  apiaryId, 
  compact = false, 
  showHourly = true,
}) => {
  const { data: currentWeather, isLoading: loadingCurrent, error: currentError } = useCurrentWeather(
    apiaryId || '', 
    { enabled: !!apiaryId }
  );
  
  const { data: hourlyForecast, isLoading: loadingHourly, error: hourlyError } = useWeatherHourlyForecast(
    apiaryId || '', 
    { enabled: !!apiaryId && showHourly }
  );
  
  const { data: dailyForecast, isLoading: loadingDaily, error: dailyError } = useWeatherDailyForecast(
    apiaryId || '', 
    { enabled: !!apiaryId }
  );

  if (!apiaryId) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Select a hive with an apiary to view weather
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
        <AlertDescription>
          Unable to load weather data
        </AlertDescription>
      </Alert>
    );
  }

  if (!currentWeather && !hourlyForecast && !dailyForecast) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No weather data available
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {currentWeather && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Current Weather</h3>
          <div className="flex items-center justify-between p-3 bg-accent rounded-md">
            <div className="flex items-center gap-3">
              {getWeatherIcon(currentWeather.condition)}
              <div>
                <div className="font-semibold text-lg">
                  {Math.round(currentWeather.temperature)}°C
                </div>
                <div className="text-xs text-muted-foreground">
                  Feels like {Math.round(currentWeather.feelsLike)}°C
                </div>
              </div>
            </div>
            <div className="text-right text-xs">
              <div>Humidity: {currentWeather.humidity}%</div>
              <div>Wind: {Math.round(currentWeather.windSpeed)} km/h</div>
            </div>
          </div>
        </div>
      )}

      {showHourly && hourlyForecast && hourlyForecast.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Next 5 Hours</h3>
          <div className="space-y-1">
            {hourlyForecast.slice(0, compact ? 3 : 5).map((hour) => (
              <div
                key={hour.id}
                className="flex items-center justify-between p-2 hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center gap-2 flex-1">
                  {getWeatherIcon(hour.condition)}
                  <span className="text-sm">
                    {new Date(hour.timestamp).toLocaleTimeString('en-US', { 
                      hour: 'numeric',
                      hour12: true 
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium">
                    {Math.round(hour.temperature)}°
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {hour.humidity}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dailyForecast && dailyForecast.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">5-Day Forecast</h3>
          <div className="space-y-1">
            {dailyForecast.slice(0, compact ? 3 : 5).map((day) => (
              <div
                key={day.id}
                className="flex items-center justify-between p-2 hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center gap-2 flex-1">
                  {getWeatherIcon(day.condition)}
                  <span className="text-sm">{formatDate(day.date)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {Math.round(day.temperatureMin)}°
                  </span>
                  <span className="font-medium">
                    {Math.round(day.temperatureMax)}°
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};