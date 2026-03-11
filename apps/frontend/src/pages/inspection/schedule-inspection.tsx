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
import {
  useHives,
  useCreateInspection,
  useCreateBatchInspection,
} from '@/api/hooks';
import { useWeatherDailyForecast } from '@/api/hooks/useWeather';
import { WeatherCondition, InspectionStatus } from 'shared-schemas';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const scheduleSchema = z
  .object({
    hiveIds: z.array(z.string()).min(1, 'Please select at least one hive'),
    date: z.date(),
    notes: z.string().optional(),
    createAsBatch: z.boolean().optional(),
    batchName: z.string().optional(),
  })
  .refine(
    data => {
      // If createAsBatch is true, batchName must be provided
      if (
        data.createAsBatch &&
        (!data.batchName || data.batchName.trim() === '')
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Batch name is required when creating a batch inspection',
      path: ['batchName'],
    },
  );

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
  const { t } = useTranslation('inspection');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHiveIds, setSelectedHiveIds] = useState<string[]>([]);
  const [selectedApiaryIds, setSelectedApiaryIds] = useState<string[]>([]);
  const [daysToShow, setDaysToShow] = useState(7);
  const { data: hives } = useHives();
  const navigate = useNavigate();
  const { mutate: createInspection } = useCreateInspection();
  const { mutate: createBatchInspection } = useCreateBatchInspection();

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
      createAsBatch: false,
      batchName: '',
    },
  });

  const createAsBatch = form.watch('createAsBatch');

  const handleSchedule = form.handleSubmit(async data => {
    const { hiveIds, date, notes, createAsBatch, batchName } = data;

    // Get the apiary ID from the first selected hive
    const firstHive = hives?.find(h => h.id === hiveIds[0]);
    const apiaryId = firstHive?.apiaryId;

    if (!apiaryId) {
      toast.error(t('inspection:schedule.noApiary'));
      return;
    }

    if (createAsBatch && batchName) {
      // Create batch inspection
      createBatchInspection(
        {
          name: batchName,
          apiaryId,
          hiveIds,
        },
        {
          onSuccess: batch => {
            toast.success(t('inspection:schedule.batchCreated', { name: batchName }));
            navigate(`/batch-inspections/${batch.id}`);
          },
          onError: error => {
            console.error('Failed to create batch inspection:', error);
            toast.error(t('inspection:schedule.batchCreateFailed'));
          },
        },
      );
    } else {
      // Create individual inspections
      let successCount = 0;
      let errorCount = 0;

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
        toast.success(t(successCount > 1 ? 'inspection:schedule.scheduledSuccessPlural' : 'inspection:schedule.scheduledSuccess', { count: successCount }));
        navigate('/inspections/list/upcoming');
      }

      if (errorCount > 0) {
        toast.error(t(errorCount > 1 ? 'inspection:schedule.scheduledFailedPlural' : 'inspection:schedule.scheduledFailed', { count: errorCount }));
      }
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
        <h1 className="text-2xl font-bold mb-2">{t('inspection:schedule.title')}</h1>
        <p className="text-muted-foreground">
          {t('inspection:schedule.description')}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSchedule} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('inspection:schedule.selectHives')}</CardTitle>
              <CardDescription>
                {t('inspection:schedule.selectHivesDescription')}
              </CardDescription>
              {selectedHiveIds.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">
                    {t(selectedHiveIds.length !== 1 ? 'inspection:schedule.hivesSelectedPlural' : 'inspection:schedule.hivesSelected', { count: selectedHiveIds.length })}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="h-6 px-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t('inspection:schedule.clear')}
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
              <CardTitle>{t('inspection:schedule.scheduleCalendar')}</CardTitle>
              <CardDescription>
                {t('inspection:schedule.calendarDescription', { days: daysToShow })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedHiveIds.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    {t('inspection:schedule.selectHiveFirst')}
                  </AlertDescription>
                </Alert>
              ) : !primaryApiaryId ? (
                <Alert>
                  <AlertDescription>
                    {t('inspection:schedule.noApiaryWeather')}
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
                                {isToday ? t('inspection:schedule.today') : format(day, 'EEE')}
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
                                  ? t('inspection:schedule.noForecast')
                                  : t('inspection:schedule.noWeatherData')}
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
                        {t('inspection:schedule.showFewerDays')}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={showMoreDays}
                      size="sm"
                    >
                      {t('inspection:schedule.showMoreDays')}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {selectedDate && selectedHiveIds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('inspection:schedule.inspectionDetails')}</CardTitle>
                <CardDescription>
                  {t(selectedHiveIds.length !== 1 ? 'inspection:schedule.schedulingCountPlural' : 'inspection:schedule.schedulingCount', { count: selectedHiveIds.length, date: format(selectedDate, 'EEEE, MMMM d, yyyy') })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <label className="text-sm font-medium">{t('inspection:schedule.selectedHives')}</label>
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

                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="createAsBatch"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t('inspection:schedule.createAsBatch')}</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {t('inspection:schedule.batchDescription')}
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {createAsBatch && (
                  <FormField
                    control={form.control}
                    name="batchName"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>{t('inspection:schedule.batchName')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('inspection:schedule.batchNamePlaceholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!createAsBatch && (
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('inspection:schedule.notesOptional')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('inspection:schedule.notesPlaceholder')}
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {createAsBatch
                        ? t('inspection:schedule.batchInfo')
                        : t('inspection:schedule.scheduledInfo')}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {createAsBatch
                      ? t('inspection:schedule.batchStartInfo')
                      : t('inspection:schedule.scheduledStartInfo')}
                  </p>
                </div>

                <Button type="submit" className="w-full mt-6">
                  {createAsBatch
                    ? t('inspection:schedule.createBatchInspection')
                    : t(selectedHiveIds.length !== 1 ? 'inspection:schedule.scheduleCountPlural' : 'inspection:schedule.scheduleCount', { count: selectedHiveIds.length })}
                </Button>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </div>
  );
};
