import { format } from 'date-fns';
import { ChevronRight, Cloud, CloudRain, CloudSun, Sun } from 'lucide-react';

// Get weather icon based on condition
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

// Format weather condition for display
const formatWeatherCondition = (condition: string) => {
  if (!condition) return '';
  return condition
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

type InspectionHeaderProps = {
  hiveName: string;
  hiveId: string;
  date: string;
  temperature?: number;
  weatherConditions?: string;
};

export const InspectionHeader = ({
  hiveName,
  hiveId,
  date,
  temperature,
  weatherConditions,
}: InspectionHeaderProps) => {
  return (
    <div className="p-4 mb-4">
      <div className="flex flex-col justify-between items-start gap-2">
        <div>
          <h3 className="font-medium flex gap-5">
            {hiveName}
            <a href={`/hives/${hiveId}`} className="flex items-center text-xs">
              View hive
              <ChevronRight size={16} className="ml-1" />
            </a>
          </h3>
        </div>
        <div className="text-xs">{format(date, 'dd/MM/yyyy HH:mm')}</div>

        <div>
          <span className="text-sm text-gray-500">
            {temperature && <>{temperature}°C</>}
            {weatherConditions && (
              <div className={'flex items-center gap-2'}>
                {formatWeatherCondition(weatherConditions)}{' '}
                {getWeatherIcon(weatherConditions)}
              </div>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};