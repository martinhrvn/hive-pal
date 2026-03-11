import { Cloud, CloudRain, CloudSun, Sun, Thermometer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

const getWeatherIcon = (condition: string) => {
  switch (condition.toLowerCase()) {
    case 'sunny':
      return <Sun className="h-6 w-6 text-amber-500" />;
    case 'partly-cloudy':
      return <CloudSun className="h-6 w-6 text-blue-400" />;
    case 'cloudy':
      return <Cloud className="h-6 w-6 text-gray-500" />;
    case 'rainy':
      return <CloudRain className="h-6 w-6 text-blue-600" />;
    default:
      return <Cloud className="h-6 w-6 text-gray-500" />;
  }
};

const formatWeatherCondition = (condition: string) => {
  if (!condition) return '';
  return condition
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

type WeatherCardProps = {
  temperature?: number | null;
  weatherConditions?: string | null;
};

export const WeatherCard = ({
  temperature,
  weatherConditions,
}: WeatherCardProps) => {
  const { t } = useTranslation('inspection');
  if (!temperature && !weatherConditions) return null;

  return (
    <Card className="p-6">
      <CardHeader className="pb-3">
        <CardTitle>
          <div className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            {t('inspection:weatherCard.title')}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {temperature && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t('inspection:weatherCard.temperature')}</div>
              <div className="text-2xl font-bold text-orange-600">
                {temperature}°C
              </div>
            </div>
          )}

          {weatherConditions && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t('inspection:weatherCard.conditions')}</div>
              <div className="flex items-center gap-2">
                {getWeatherIcon(weatherConditions)}
                <span className="text-lg font-medium">
                  {formatWeatherCondition(weatherConditions)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
