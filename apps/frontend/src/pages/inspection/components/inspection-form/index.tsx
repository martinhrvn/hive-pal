import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router-dom';
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
import {
  useHiveOptions,
  useInspection,
  useHive,
  useWeatherForDate,
  useUpsertInspection,
} from '@/api/hooks';
import { ActionType, InspectionStatus } from 'shared-schemas';
import { mapWeatherConditionToForm } from '@/utils/weather-mapping';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { AudioSection } from './audio-section';
import { PhotosSection, PendingPhoto } from './photos-section';
import { uploadPendingPhotos } from './upload-pending-photos';
import { uploadPendingRecordings } from './upload-pending-recordings';
import { ScorePreviewSection } from './score-preview';
import { FrameCountSection } from './frame-counts';
import { InspectionDateTimePicker } from '@/components/inspection-date-time-picker';

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
  const { t } = useTranslation('inspection');
  const [searchParams] = useSearchParams();
  const fromScheduled = searchParams.get('from') === 'scheduled';
  const { data: hives } = useHiveOptions();
  const [pendingRecordings, setPendingRecordings] = useState<
    PendingRecording[]
  >([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);

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
      isAllDay: inspection?.isAllDay ?? true,
      actions:
        inspection?.actions?.map(action => {
          if (action.details.type === ActionType.FEEDING) {
            const details = action.details;
            return {
              type: ActionType.FEEDING,
              notes: action.notes,
              feedType: details.feedType,
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

  // Calculate total frames from brood boxes only (honey supers are excluded)
  // If the user has recorded a box configuration action, use its updated boxes instead
  const formActions = form.watch('actions') || [];
  const boxConfigAction = formActions.find(a => a.type === 'BOX_CONFIGURATION') as
    | import('./schema').BoxConfigurationActionData
    | undefined;

  const effectiveBoxes = boxConfigAction?.updatedBoxes ?? selectedHive?.boxes ?? [];

  const totalFrames =
    effectiveBoxes
      .filter((box: { type: string }) => box.type === 'BROOD')
      .reduce((sum: number, box: { frameCount: number }) => sum + box.frameCount, 0) || null;

  const broodBoxCount =
    effectiveBoxes.filter((box: { type: string }) => box.type === 'BROOD').length || null;

  const inspectionType = selectedHive?.inspectionType ?? 'data_driven';
  const isSubjective = inspectionType === 'subjective';

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

  const onSubmit = useUpsertInspection(inspectionId, {
    onBeforeNavigate: async (id: string) => {
      await Promise.all([
        pendingRecordings.length > 0
          ? uploadPendingRecordings(id, pendingRecordings)
          : Promise.resolve(),
        pendingPhotos.length > 0
          ? uploadPendingPhotos(id, pendingPhotos)
          : Promise.resolve(),
      ]);
    },
  });

  const validateSubjectiveStrength = (data: InspectionFormData): boolean => {
    const strength = data.observations?.strength;
    if (isSubjective && strength != null && strength > 10) {
      form.setError('observations.strength', {
        message: 'Must be between 0 and 10 in subjective mode',
      });
      return false;
    }
    return true;
  };

  // Handler for regular save button
  const handleSave = form.handleSubmit(data => {
    if (!validateSubjectiveStrength(data)) return;
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
    if (!validateSubjectiveStrength(data)) return;
    if (mode === 'batch' && onSubmitSuccess) {
      onSubmitSuccess(data);
    } else {
      onSubmit(data, InspectionStatus.COMPLETED);
    }
  });

  const date = form.watch('date');
  const isAllDay = form.watch('isAllDay') ?? true;
  const isInFuture = date && date > new Date();
  const isEdit = Boolean(inspectionId);
  const isCompleted = inspection?.status === InspectionStatus.COMPLETED;
  const { isSubmitting } = form.formState;
  return (
    <div className={'max-w-4xl mx-auto px-4'}>
      <h1 className={'text-lg font-bold'}>
        {isEdit ? t('inspection:form.editInspection') : t('inspection:form.newInspection')}
      </h1>
      <Separator className="my-2" />
      <Form {...form}>
        <form onSubmit={e => e.preventDefault()} className="space-y-6">
          <FormField
            control={form.control}
            name="hiveId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('inspection:form.hive')}</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? hiveId}
                    disabled={mode === 'batch'}
                  >
                    <SelectTrigger className={'w-full'}>
                      <SelectValue placeholder={t('inspection:form.selectHive')} />
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
                  <FormLabel>{t('inspection:form.inspectionDate')}</FormLabel>
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
                            isAllDay
                              ? format(field.value, 'PPP')
                              : format(field.value, 'PPP HH:mm')
                          ) : (
                            <span>{t('inspection:form.pickDate')}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={selected => {
                          if (!selected) return;
                          if (!isAllDay && field.value) {
                            selected.setHours(
                              field.value.getHours(),
                              field.value.getMinutes(),
                              0,
                              0,
                            );
                          }
                          field.onChange(selected);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="flex items-center gap-2 mt-1">
                    <InspectionDateTimePicker
                      date={field.value ?? new Date()}
                      isAllDay={isAllDay}
                      onDateChange={field.onChange}
                      onIsAllDayChange={checked => form.setValue('isAllDay', checked)}
                    />
                  </div>

                  {isInFuture && (
                    <div className={'p-4 rounded'}>
                      <strong className={'text-blue-500'}>
                        {t('inspection:form.futureScheduled')}
                      </strong>
                      <p className={'text-blue-500'}>
                        {t('inspection:form.futureScheduledDescription')}
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
              <PhotosSection
                inspectionId={inspectionId}
                pendingPhotos={pendingPhotos}
                onPendingPhotosChange={setPendingPhotos}
              />
              <hr className={'border-t border-border'} />
              <WeatherSection />

              <hr className={'border-t border-border'} />
              <ObservationsSection
                broodFrames={isSubjective ? null : totalFrames}
                broodBoxCount={isSubjective ? null : broodBoxCount}
                isSubjective={isSubjective}
              />
              <hr className={'border-t border-border'} />

              {!isSubjective && (
                <>
                  <FrameCountSection totalFrames={totalFrames} />
                  <hr className={'border-t border-border'} />
                  <ScorePreviewSection />
                  <hr className={'border-t border-border'} />
                </>
              )}
              <ActionsSection hiveBoxes={selectedHive?.boxes ?? []} hiveId={selectedHive?.id} />
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
                  {t('inspection:form.cancel')}
                </Button>
              )}
              <Button
                onClick={handleSave}
                type="submit"
                className="flex-1"
                data-umami-event="Batch Inspection Save and Next"
              >
                {submitButtonText || t('inspection:form.saveAndNext')}
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
                  {isSubmitting ? t('inspection:form.saving') : t('inspection:form.completeInspection')}
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
                    {isSubmitting ? t('inspection:form.saving') : t('inspection:form.save')}
                  </Button>
                  <Button
                    onClick={handleSaveAndComplete}
                    type="submit"
                    className="w-full"
                    variant={'default'}
                    disabled={isSubmitting}
                    data-umami-event="Inspection Complete"
                  >
                    {isSubmitting ? t('inspection:form.saving') : t('inspection:form.saveAndComplete')}
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
              {isSubmitting ? t('inspection:form.saving') : t('inspection:form.save')}
            </Button>
          )}
        </form>
      </Form>
    </div>
  );
};
