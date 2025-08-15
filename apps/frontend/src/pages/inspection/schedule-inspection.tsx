import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  CloudDrizzle,
  CloudFog,
  CalendarPlus,
  Home,
  X,
} from 'lucide-react';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import { useHives, useCreateInspection } from '@/api/hooks';
import { useWeatherDailyForecast } from '@/api/hooks/useWeather';
import { WeatherCondition, InspectionStatus } from 'shared-schemas';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

const scheduleSchema = z.object({
  hiveIds: z.array(z.string()).min(1, 'Please select at least one hive'),
  date: z.date(),
  notes: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

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

export const ScheduleInspectionPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHiveIds, setSelectedHiveIds] = useState<string[]>([]);
  const [selectedApiaryIds, setSelectedApiaryIds] = useState<string[]>([]);
  const [daysToShow, setDaysToShow] = useState(7);
  const { data: hives } = useHives();
  const navigate = useNavigate();
  const { mutate: createInspection } = useCreateInspection();

  // Get weather for the first selected apiary (assuming hives in same apiary have same weather)
  const primaryApiaryId = selectedApiaryIds[0];
  const { data: weatherForecast, isLoading: weatherLoading } =
    useWeatherDailyForecast(primaryApiaryId || '', {
      enabled: !!primaryApiaryId,
    });

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      hiveIds: [],
      notes: '',
    },
  });

  const handleSchedule = form.handleSubmit(async data => {
    const { hiveIds, date, notes } = data;
    let successCount = 0;
    let errorCount = 0;

    // Create an inspection for each selected hive
    for (const hiveId of hiveIds) {
      try {
        await new Promise<void>((resolve, reject) => {
          createInspection(
            {
              hiveId,
              date: date.toISOString(),
              notes,
              status: InspectionStatus.SCHEDULED,
              actions: [],
            },
            {
              onSuccess: () => {
                successCount++;
                resolve();
              },
              onError: error => {
                errorCount++;
                console.error(
                  `Failed to create inspection for hive ${hiveId}:`,
                  error,
                );
                reject(error);
              },
            },
          );
        });
      } catch {
        // Error already counted and logged
      }
    }

    if (successCount > 0) {
      alert(
        `Successfully scheduled ${successCount} inspection${successCount > 1 ? 's' : ''}`,
      );
      navigate('/inspections/list/upcoming');
    }

    if (errorCount > 0) {
      alert(
        `Failed to schedule ${errorCount} inspection${errorCount > 1 ? 's' : ''}`,
      );
    }
  });

  const handleHiveToggle = (hiveId: string, checked: boolean) => {
    const hive = hives?.find(h => h.id === hiveId);

    if (checked) {
      setSelectedHiveIds([...selectedHiveIds, hiveId]);
      if (hive?.apiaryId && !selectedApiaryIds.includes(hive.apiaryId)) {
        setSelectedApiaryIds([...selectedApiaryIds, hive.apiaryId]);
      }
      form.setValue('hiveIds', [...selectedHiveIds, hiveId]);
    } else {
      const newHiveIds = selectedHiveIds.filter(id => id !== hiveId);
      setSelectedHiveIds(newHiveIds);

      // Update apiary IDs if no more hives from that apiary are selected
      if (hive?.apiaryId) {
        const otherHivesInApiary = newHiveIds.some(id => {
          const h = hives?.find(h => h.id === id);
          return h?.apiaryId === hive.apiaryId;
        });

        if (!otherHivesInApiary) {
          setSelectedApiaryIds(
            selectedApiaryIds.filter(id => id !== hive.apiaryId),
          );
        }
      }
      form.setValue('hiveIds', newHiveIds);
    }
  };

  const clearSelection = () => {
    setSelectedHiveIds([]);
    setSelectedApiaryIds([]);
    form.setValue('hiveIds', []);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    form.setValue('date', date);
  };

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

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Schedule Inspection</h1>
        <p className="text-muted-foreground">
          Plan your inspections for the next 7 days with weather forecast
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSchedule} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Hives</CardTitle>
              <CardDescription>
                Choose which hives you want to schedule inspections for
              </CardDescription>
              {selectedHiveIds.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">
                    {selectedHiveIds.length} hive
                    {selectedHiveIds.length !== 1 ? 's' : ''} selected
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="h-6 px-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="hiveIds"
                render={() => (
                  <FormItem>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {hives?.map(hive => (
                        <FormField
                          key={hive.id}
                          control={form.control}
                          name="hiveIds"
                          render={() => {
                            return (
                              <FormItem
                                key={hive.id}
                                className="flex flex-row items-center space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={selectedHiveIds.includes(hive.id)}
                                    onCheckedChange={checked =>
                                      handleHiveToggle(
                                        hive.id,
                                        checked as boolean,
                                      )
                                    }
                                  />
                                </FormControl>
                                <label
                                  htmlFor={hive.id}
                                  className="flex items-center gap-2 text-sm font-normal cursor-pointer flex-1"
                                  onClick={e => {
                                    e.preventDefault();
                                    handleHiveToggle(
                                      hive.id,
                                      !selectedHiveIds.includes(hive.id),
                                    );
                                  }}
                                >
                                  <Home className="h-4 w-4 text-muted-foreground" />
                                  <span>{hive.name}</span>
                                  {hive.notes && (
                                    <span className="text-xs text-muted-foreground">
                                      ({hive.notes.substring(0, 30)}...)
                                    </span>
                                  )}
                                </label>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule Calendar</CardTitle>
              <CardDescription>
                Select a day to schedule your inspection with weather forecast
                (next {daysToShow} days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedHiveIds.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Please select at least one hive to view weather forecast
                  </AlertDescription>
                </Alert>
              ) : !primaryApiaryId ? (
                <Alert>
                  <AlertDescription>
                    Selected hives don't have an associated apiary for weather
                    data
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
                      // Find matching forecast for this day
                      const dayStart = startOfDay(day);
                      const forecast = weatherForecast?.find(f => {
                        const forecastDate = startOfDay(new Date(f.date));
                        return isSameDay(forecastDate, dayStart);
                      });
                      const isSelected =
                        selectedDate && isSameDay(day, selectedDate);
                      const isToday = index === 0;
                      const hasWeatherData = !!forecast;
                      const isBeyondForecast = index >= 7;

                      return (
                        <Card
                          key={index}
                          className={cn(
                            'cursor-pointer transition-all hover:shadow-md',
                            isSelected && 'ring-2 ring-primary',
                            isToday && 'border-primary',
                            !hasWeatherData &&
                              isBeyondForecast &&
                              'border-dashed border-muted-foreground/50',
                          )}
                          onClick={() => handleDateSelect(day)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-sm">
                                {isToday ? 'Today' : format(day, 'EEE')}
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
                                  ? 'No forecast available'
                                  : 'No weather data'}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="flex justify-center gap-2 mt-6">
                    {daysToShow > 7 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={showFewerDays}
                        size="sm"
                      >
                        Show Fewer Days
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={showMoreDays}
                      size="sm"
                    >
                      Show More Days (+7)
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {selectedDate && selectedHiveIds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Inspection Details</CardTitle>
                <CardDescription>
                  Scheduling {selectedHiveIds.length} inspection
                  {selectedHiveIds.length !== 1 ? 's' : ''} for{' '}
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <label className="text-sm font-medium">Selected Hives:</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedHiveIds.map(hiveId => {
                      const hive = hives?.find(h => h.id === hiveId);
                      return (
                        <Badge key={hiveId} variant="outline">
                          <Home className="h-3 w-3 mr-1" />
                          {hive?.name || hiveId}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any notes for this scheduled inspection..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      This inspection will be scheduled for a future date
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    You can add details and complete the inspection on the
                    scheduled date.
                  </p>
                </div>

                <Button type="submit" className="w-full mt-6">
                  Schedule {selectedHiveIds.length} Inspection
                  {selectedHiveIds.length !== 1 ? 's' : ''}
                </Button>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </div>
  );
};
