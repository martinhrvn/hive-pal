import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import { 
  Calendar, 
  CalendarPlus,
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  CloudDrizzle,
  CloudFog,
  Home
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { InspectionResponse } from 'shared-schemas';
import { WeatherCondition } from 'shared-schemas';
import { useHives } from '@/api/hooks';
import { useWeatherDailyForecast } from '@/api/hooks/useWeather';

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspection: InspectionResponse;
  hiveName: string;
  onReschedule: (date: Date) => void;
}

const getWeatherIcon = (condition: WeatherCondition) => {
  const iconClass = 'h-5 w-5';
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

export const RescheduleDialog: React.FC<RescheduleDialogProps> = ({
  open,
  onOpenChange,
  inspection,
  hiveName,
  onReschedule,
}) => {
  const { t } = useTranslation(['inspection']);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [daysToShow, setDaysToShow] = useState(7);

  const { data: hives } = useHives();
  const hive = hives?.find(h => h.id === inspection.hiveId);
  
  // Get weather for the hive's apiary
  const { data: weatherForecast, isLoading: weatherLoading } = useWeatherDailyForecast(
    hive?.apiaryId || '', 
    {
      enabled: !!hive?.apiaryId && open,
    }
  );

  const getNextNDays = (numDays: number) => {
    const days = [];
    for (let i = 0; i < numDays; i++) {
      days.push(addDays(new Date(), i));
    }
    return days;
  };

  const nextDays = getNextNDays(daysToShow);

  const showMoreDays = () => {
    setDaysToShow(prev => prev + 7);
  };

  const showFewerDays = () => {
    setDaysToShow(Math.max(7, daysToShow - 7));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleReschedule = () => {
    if (selectedDate) {
      onReschedule(selectedDate);
      setSelectedDate(null);
      setDaysToShow(7);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedDate(null);
    setDaysToShow(7);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('inspection:dialogs.reschedule.title')}</DialogTitle>
          <DialogDescription>
            {t('inspection:dialogs.reschedule.description', { hiveName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!hive?.apiaryId ? (
            <Alert>
              <AlertDescription>
                This hive doesn't have an associated apiary for weather data.
              </AlertDescription>
            </Alert>
          ) : weatherLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {nextDays.map((_, index) => (
                <Skeleton key={index} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {nextDays.map((day, index) => {
                  const dayStart = startOfDay(day);
                  const forecast = weatherForecast?.find(f => {
                    const forecastDate = startOfDay(new Date(f.date));
                    return isSameDay(forecastDate, dayStart);
                  });
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isTodayCard = index === 0;
                  const hasWeatherData = !!forecast;
                  const isBeyondForecast = index >= 7;

                  return (
                    <Card
                      key={index}
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-md',
                        isSelected && 'ring-2 ring-primary',
                        isTodayCard && 'border-primary',
                        !hasWeatherData && 
                          isBeyondForecast && 
                          'border-dashed border-muted-foreground/50',
                      )}
                      onClick={() => handleDateSelect(day)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-sm">
                            {isTodayCard ? 'Today' : format(day, 'EEE')}
                          </div>
                          {isSelected && (
                            <CalendarPlus className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mb-3">
                          {format(day, 'MMM d')}
                        </div>

                        {forecast ? (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              {getWeatherIcon(forecast.condition)}
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {Math.round(forecast.temperatureMax)}°
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {Math.round(forecast.temperatureMin)}°
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <div>💧 {forecast.humidity}%</div>
                              <div>
                                💨 {Math.round(forecast.windSpeed)} km/h
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            {isBeyondForecast
                              ? t('inspection:dialogs.reschedule.noForecast')
                              : t('inspection:dialogs.reschedule.noWeatherData')}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-center gap-2">
                {daysToShow > 7 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={showFewerDays}
                    size="sm"
                  >
                    {t('inspection:dialogs.reschedule.showFewerDays')}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={showMoreDays}
                  size="sm"
                >
                  {t('inspection:dialogs.reschedule.showMoreDays')}
                </Button>
              </div>
            </>
          )}

          {selectedDate && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t('inspection:dialogs.reschedule.newDate', {
                    date: format(selectedDate, 'EEEE, MMMM d, yyyy')
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Home className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  {hiveName}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t('inspection:dialogs.reschedule.cancel')}
          </Button>
          <Button 
            onClick={handleReschedule}
            disabled={!selectedDate}
          >
            {t('inspection:dialogs.reschedule.reschedule')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};