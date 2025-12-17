import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils.ts';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { InspectionFormData, inspectionSchema } from './schema';
import { WeatherSection } from '@/pages/inspection/components/inspection-form/weather.tsx';
import { ObservationsSection } from '@/pages/inspection/components/inspection-form/observations.tsx';
import { NotesSection } from '@/pages/inspection/components/inspection-form/notes.tsx';
import { Separator } from '@/components/ui/separator';
import { ActionsSection } from '@/pages/inspection/components/inspection-form/actions.tsx';
import { FeedType } from './actions/feeding';
import {
  useHiveOptions,
  useInspection,
  useHive,
  useWeatherForDate,
  useCreateInspection,
  useUpdateInspection,
} from '@/api/hooks';
import { ActionType, InspectionStatus } from 'shared-schemas';
import { mapWeatherConditionToForm } from '@/utils/weather-mapping';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { AudioSection, uploadPendingRecordings } from './audio-section';

interface PendingRecording {
  id: string;
  blob: Blob;
  duration: number;
  fileName: string;
}

type InspectionFormProps = {
  hiveId?: string;
  inspectionId?: string;
  mode?: 'standalone' | 'batch';
  onSubmitSuccess?: (data: InspectionFormData) => void;
  onCancel?: () => void;
  submitButtonText?: React.ReactNode;
  showCancelButton?: boolean;
};

export const InspectionForm: React.FC<InspectionFormProps> = ({
  hiveId,
  inspectionId,
  mode = 'standalone',
  onSubmitSuccess,
  onCancel,
  submitButtonText,
  showCancelButton = false,
}) => {
  const [searchParams] = useSearchParams();
  const fromScheduled = searchParams.get('from') === 'scheduled';
  const { data: hives } = useHiveOptions();
  const [pendingRecordings, setPendingRecordings] = useState<
    PendingRecording[]
  >([]);

  // Use our new custom hooks
  const { data: inspection } = useInspection(inspectionId as string, {
    enabled: !!inspectionId,
  });

  const form = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      hiveId,
      ...inspection,
      date: inspection?.date ? new Date(inspection.date) : new Date(),
      actions:
        inspection?.actions?.map(action => {
          if (action.details.type === ActionType.FEEDING) {
            const details = action.details;
            return {
              type: ActionType.FEEDING,
              notes: action.notes,
              feedType: details.feedType as FeedType,
              quantity: details.amount,
              unit: details.unit,
              concentration: details.concentration,
            };
          } else if (action.details.type === ActionType.TREATMENT) {
            const details = action.details;
            return {
              type: ActionType.TREATMENT,
              notes: action.notes,
              amount: details.quantity,
              treatmentType: details.product,
              unit: details.unit,
            };
          } else if (action.details.type === ActionType.FRAME) {
            const details = action.details;
            return {
              type: ActionType.FRAME,
              notes: action.notes,
              frames: details.quantity,
            };
          } else {
            return {
              type: ActionType.OTHER,
              notes: action.notes,
            };
          }
        }) || [],
    },
  });

  // Watch for changes in hive selection and date to auto-populate weather
  const selectedHiveId = form.watch('hiveId');
  const selectedDate = form.watch('date');

  // Get hive details to access apiaryId
  const { data: selectedHive } = useHive(selectedHiveId || '', {
    enabled: !!selectedHiveId,
  });

  // Format date for API call
  const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const isDateInFuture = selectedDate && selectedDate > new Date();

  // Fetch weather for the selected date
  const { data: weatherData } = useWeatherForDate(
    selectedHive?.apiaryId || '',
    dateString,
    {
      enabled: !!selectedHive?.apiaryId && !!dateString && !isDateInFuture,
    },
  );

  // Auto-populate weather when data is available
  useEffect(() => {
    if (weatherData && !isDateInFuture && selectedHive?.apiaryId) {
      // Always update both temperature and weather conditions from weather data
      form.setValue('temperature', Math.round(weatherData.temperature));

      const mappedCondition = mapWeatherConditionToForm(weatherData.condition);
      form.setValue('weatherConditions', mappedCondition);
    }
  }, [weatherData, form, isDateInFuture, selectedHive?.apiaryId]);

  const onSubmit = useUpsertInspection(inspectionId);

  // Handler for regular save button
  const handleSave = form.handleSubmit(data => {
    if (mode === 'batch' && onSubmitSuccess) {
      // In batch mode, call the custom success handler
      onSubmitSuccess(data);
    } else {
      // If coming from scheduled inspection, automatically mark as completed
      const status = fromScheduled ? InspectionStatus.COMPLETED : undefined;
      onSubmit(data, status);
    }
  });

  // Handler for save and complete button
  const handleSaveAndComplete = form.handleSubmit(data => {
    if (mode === 'batch' && onSubmitSuccess) {
      onSubmitSuccess(data);
    } else {
      onSubmit(data, InspectionStatus.COMPLETED);
    }
  });
  const navigate = useNavigate();
  const createInspection = useCreateInspection();
  const updateInspection = useUpdateInspection();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transform form data to API format
  const transformFormData = (
    data: InspectionFormData,
    status?: InspectionStatus,
  ) => {
    const transformedActions = data.actions
      ?.map(action => {
        switch (action.type) {
          case 'FEEDING':
            return {
              type: action.type,
              notes: action.notes,
              details: {
                type: action.type,
                feedType: action.feedType,
                amount: action.quantity,
                unit: action.unit,
                concentration: action.concentration,
              },
            };
          case 'TREATMENT':
            return {
              type: action.type,
              notes: action.notes,
              details: {
                type: action.type,
                product: action.treatmentType,
                quantity: action.amount,
                unit: action.unit,
              },
            };
          case 'FRAME':
            return {
              type: ActionType.FRAME,
              notes: action.notes,
              details: {
                type: ActionType.FRAME,
                quantity: action.frames,
              },
            };
          default:
            return null;
        }
      })
      .filter(Boolean);

    return {
      ...data,
      date: data.date.toISOString(),
      status: status || data.status,
      actions: transformedActions,
    };
  };

  // Handler for submission
  const handleSubmit = async (
    data: InspectionFormData,
    status?: InspectionStatus,
  ) => {
    setIsSubmitting(true);
    try {
      const formattedData = transformFormData(data, status);
      let resultId: string;

      if (!inspectionId) {
        // Create new inspection
        const result = await createInspection.mutateAsync(formattedData);
        resultId = result.id;

        // Upload pending audio recordings
        if (pendingRecordings.length > 0) {
          await uploadPendingRecordings(resultId, pendingRecordings);
        }
      } else {
        // Update existing inspection
        const result = await updateInspection.mutateAsync({
          id: inspectionId,
          data: { ...formattedData, id: inspectionId },
        });
        resultId = result.id;
      }

      navigate(`/inspections/${resultId}`);
    } catch (error) {
      console.error('Failed to save inspection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for regular save button
  const handleSave = form.handleSubmit(data => {
    const status = fromScheduled ? InspectionStatus.COMPLETED : undefined;
    handleSubmit(data, status);
  });

  // Handler for save and complete button
  const handleSaveAndComplete = form.handleSubmit(data =>
    handleSubmit(data, InspectionStatus.COMPLETED),
  );
  const date = form.watch('date');
  const isInFuture = date && date > new Date();
  const isEdit = Boolean(inspectionId);
  const isCompleted = inspection?.status === InspectionStatus.COMPLETED;
  return (
    <div className={'max-w-4xl ml-4'}>
      <h1 className={'text-lg font-bold'}>
        {isEdit ? 'Edit inspection' : 'New inspection'}
      </h1>
      <Separator className="my-2" />
      <Form {...form}>
        <form onSubmit={e => e.preventDefault()} className="space-y-6">
          <FormField
            control={form.control}
            name="hiveId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hive</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? hiveId}
                    disabled={mode === 'batch'}
                  >
                    <SelectTrigger className={'w-full'}>
                      <SelectValue placeholder={'Select a hive'} />
                    </SelectTrigger>
                    <SelectContent>
                      {hives?.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          {mode !== 'batch' && (
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Inspection date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {isInFuture && (
                    <div className={'p-4 rounded'}>
                      <strong className={'text-blue-500'}>
                        This inspection is scheduled for the future
                      </strong>
                      <p className={'text-blue-500'}>
                        You are scheduling an inspection for a future date.
                      </p>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {(mode !== 'batch' ? !isInFuture : true) && (
            <>
              <hr className={'border-t border-border'} />
              <AudioSection
                inspectionId={inspectionId}
                pendingRecordings={pendingRecordings}
                onPendingRecordingsChange={setPendingRecordings}
              />
              <hr className={'border-t border-border'} />
              <WeatherSection />

              <hr className={'border-t border-border'} />
              <ObservationsSection />
              <hr className={'border-t border-border'} />
              <ActionsSection />
              <hr className={'border-t border-border'} />
              <NotesSection />
            </>
          )}

          {mode === 'batch' ? (
            <div className="flex gap-2">
              {showCancelButton && onCancel && (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  type="button"
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleSave}
                type="submit"
                className="flex-1"
                data-umami-event="Batch Inspection Save and Next"
              >
                {submitButtonText || 'Save and Next'}
              </Button>
            </div>
          ) : isEdit && !isCompleted ? (
            <>
              {fromScheduled ? (
                <Button
                  onClick={handleSave}
                  type="submit"
                  className="w-full"
                  variant={'default'}
                  disabled={isSubmitting}
                  data-umami-event="Inspection Complete"
                >
                  {isSubmitting ? 'Saving...' : 'Complete Inspection'}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    variant={'outline'}
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                    data-umami-event="Inspection Save"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={handleSaveAndComplete}
                    type="submit"
                    className="w-full"
                    variant={'default'}
                    disabled={isSubmitting}
                    data-umami-event="Inspection Complete"
                  >
                    {isSubmitting ? 'Saving...' : 'Save and complete'}
                  </Button>
                </>
              )}
            </>
          ) : (
            <Button
              onClick={handleSave}
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              data-umami-event="Inspection Create"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          )}
        </form>
      </Form>
    </div>
  );
};
