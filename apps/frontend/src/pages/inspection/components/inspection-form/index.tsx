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
import { ScorePreviewSection } from './score-preview';
import { AiMergeBanner } from '@/pages/inspection/components/inspection-form/ai-merge-banner';
import { InspectionDateTimePicker } from '@/components/inspection-date-time-picker';
import { FrameCountSection } from './frame-counts';
import { uploadPendingPhotos } from './upload-pending-photos';
import { uploadPendingRecordings } from './upload-pending-recordings';
import { useInspectionAiMerge } from './use-inspection-ai-merge';
import { applyInspectionModeToFormData } from './mode-behavior';
import type { Box } from 'shared-schemas';

const normalizeBoxSummary = (
  boxesSummary:
    | Array<{ type: string; frameCount: number }>
    | undefined,
  fallbackBoxes: Box[] = [],
): Box[] | undefined => {
  if (!boxesSummary?.length) return undefined;

  return boxesSummary.map((summaryBox, index) => {
    const fallbackBox = fallbackBoxes[index];

    return {
      ...fallbackBox,
      hasExcluder: fallbackBox?.hasExcluder ?? false,
      maxFrameCount:
        fallbackBox?.maxFrameCount ?? Math.max(summaryBox.frameCount, 1),
      variant: fallbackBox?.variant,
      frameSizeId: fallbackBox?.frameSizeId ?? null,
      color: fallbackBox?.color,
      winterized: fallbackBox?.winterized ?? false,
      type: summaryBox.type as Box['type'],
      frameCount: summaryBox.frameCount,
      position: index,
    };
  });
};

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
  aiDraft?: Partial<InspectionFormData>;
  aiSuggestedFields?: string[];
};

export const InspectionForm: React.FC<InspectionFormProps> = ({
  hiveId,
  inspectionId,
  mode = 'standalone',
  onSubmitSuccess,
  onCancel,
  submitButtonText,
  showCancelButton = false,
  aiDraft,
  aiSuggestedFields = [],
}) => {
  const { t } = useTranslation('inspection');
  const [searchParams] = useSearchParams();
  const fromScheduled = searchParams.get('from') === 'scheduled';
  const { data: hives } = useHiveOptions();
  const [pendingRecordings, setPendingRecordings] = useState<
    PendingRecording[]
  >([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);

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
              notes: action.notes ?? '',
              feedType: details.feedType,
              quantity: details.amount,
              unit: details.unit,
              concentration: details.concentration ?? '',
            };
          }

          if (action.details.type === ActionType.TREATMENT) {
            const details = action.details;
            return {
              type: ActionType.TREATMENT,
              notes: action.notes ?? '',
              amount: details.quantity,
              treatmentType: details.product,
              unit: details.unit,
            };
          }

          if (action.details.type === ActionType.FRAME) {
            const details = action.details;
            return {
              type: ActionType.FRAME,
              notes: action.notes ?? '',
              frames: details.quantity,
            };
          }

          if (action.details.type === ActionType.MAINTENANCE) {
            const details = action.details;
            return {
              type: ActionType.MAINTENANCE,
              notes: action.notes ?? '',
              component: details.component,
              status: details.status,
            };
          }

          if (action.details.type === ActionType.NOTE) {
            const details = action.details;
            return {
              type: ActionType.NOTE,
              notes: details.content || action.notes || '',
            };
          }

          if (action.details.type === ActionType.BOX_CONFIGURATION) {
            const details = action.details;
            return {
              type: ActionType.BOX_CONFIGURATION,
              boxesAdded: details.boxesAdded,
              boxesRemoved: details.boxesRemoved,
              framesAdded: details.framesAdded,
              framesRemoved: details.framesRemoved,
              totalBoxes: details.totalBoxes,
              totalFrames: details.totalFrames,
              boxesSummary: details.boxes,
            };
          }

          return {
            type: ActionType.OTHER,
            notes: action.notes || '',
          };
        }) || [],
    },
  });

  const selectedHiveId = form.watch('hiveId');
  const selectedDate = form.watch('date');

  const { data: selectedHive } = useHive(selectedHiveId || '', {
    enabled: !!selectedHiveId,
  });

  // Calculate total frames from brood boxes only (honey supers are excluded)
  // If the user has recorded a box configuration action, use its updated boxes instead
  const formActions = form.watch('actions') || [];
  const boxConfigAction = formActions.find(a => a.type === 'BOX_CONFIGURATION');

  const summarizedBoxes = normalizeBoxSummary(
    boxConfigAction?.boxesSummary,
    selectedHive?.boxes ?? [],
  );

  const effectiveBoxes =
    boxConfigAction?.updatedBoxes ?? summarizedBoxes ?? selectedHive?.boxes ?? [];

  const totalFrames =
    effectiveBoxes
      .filter((box: { type: string }) => box.type === 'BROOD')
      .reduce((sum: number, box: { frameCount: number }) => sum + box.frameCount, 0) || null;

  const broodBoxCount =
    effectiveBoxes.filter((box: { type: string }) => box.type === 'BROOD').length || null;

  // Live frame (Rähmchen) delta from the form's current FRAME action(s)
  const liveFrameDelta = formActions
    .filter((a): a is { type: 'FRAME'; frames?: number } => a.type === 'FRAME')
    .reduce((sum, a) => sum + (a.frames ?? 0), 0);

  // Frame delta already persisted for this inspection (its contribution is
  // baked into the hive's box frame counts on the backend). Subtracting it
  // yields the hive's base frame count without this inspection's change.
  const savedFrameDelta = (inspection?.actions ?? []).reduce(
    (sum, action) =>
      action.details.type === ActionType.FRAME
        ? sum + action.details.quantity
        : sum,
    0,
  );

  const baseBroodFrames =
    totalFrames != null ? totalFrames - savedFrameDelta : null;

  // Total frame capacity of the brood boxes (sum of each box's maxFrameCount).
  // Used to warn when a Rähmchen action would push the hive above capacity.
  const broodFrameCapacity =
    effectiveBoxes.filter((box: { type: string }) => box.type === 'BROOD')
      .length > 0
      ? effectiveBoxes
          .filter((box: { type: string }) => box.type === 'BROOD')
          .reduce(
            (sum: number, box: { maxFrameCount?: number }) =>
              sum + (box.maxFrameCount ?? 0),
            0,
          )
      : null;

  // Effective brood frame total reflecting the current (unsaved) frame action,
  // used both for the header indicator and as the per-frame-type counter max.
  const effectiveTotalFrames =
    baseBroodFrames != null
      ? Math.max(0, baseBroodFrames + liveFrameDelta)
      : null;

  const inspectionType = selectedHive?.inspectionType ?? 'data_driven';
  const isSubjective = inspectionType === 'subjective';

  // Format date for API call
  const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const isDateInFuture = selectedDate && selectedDate > new Date();

  const { data: weatherData } = useWeatherForDate(
    selectedHive?.apiaryId || '',
    dateString,
    {
      enabled: !!selectedHive?.apiaryId && !!dateString && !isDateInFuture,
    },
  );

  useEffect(() => {
    if (weatherData && !isDateInFuture && selectedHive?.apiaryId) {
      form.setValue('temperature', Math.round(weatherData.temperature));

      const mappedCondition = mapWeatherConditionToForm(weatherData.condition);
      form.setValue('weatherConditions', mappedCondition);
    }
  }, [weatherData, form, isDateInFuture, selectedHive?.apiaryId]);

  const {
    aiMergeState,
    isAiSuggested,
    acceptAiSuggestion,
    dismissAiSuggestion,
    acceptAllSafeAiSuggestions,
    reviewConflicts,
    dismissAllAiSuggestions,
    pendingSuggestionCount,
    conflictSuggestionCount,
  } = useInspectionAiMerge({
    form,
    aiDraft,
    aiSuggestedFields,
  });

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
    const formattedData = applyInspectionModeToFormData(
      data,
      isSubjective,
      effectiveTotalFrames,
    );

    if (mode === 'batch' && onSubmitSuccess) {
      onSubmitSuccess(formattedData);
    } else {
      const status = fromScheduled ? InspectionStatus.COMPLETED : undefined;
      onSubmit(formattedData, status);
    }
  });

  const handleSaveAndComplete = form.handleSubmit(data => {
    if (!validateSubjectiveStrength(data)) return;
    const formattedData = applyInspectionModeToFormData(
      data,
      isSubjective,
      effectiveTotalFrames,
    );

    if (mode === 'batch' && onSubmitSuccess) {
      onSubmitSuccess(formattedData);
    } else {
      onSubmit(formattedData, InspectionStatus.COMPLETED);
    }
  });

  const date = form.watch('date');
  const isAllDay = form.watch('isAllDay') ?? true;
  const isInFuture = date && date > new Date();
  const isEdit = Boolean(inspectionId);
  const isCompleted = inspection?.status === InspectionStatus.COMPLETED;
  const { isSubmitting } = form.formState;

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-lg font-bold">
        {isEdit
          ? t('inspection:form.editInspection')
          : t('inspection:form.newInspection')}
      </h1>

      <Separator className="my-2" />

      {aiMergeState && pendingSuggestionCount > 0 && (
        <AiMergeBanner
          pendingCount={pendingSuggestionCount}
          conflictCount={conflictSuggestionCount}
          onAcceptAllSafe={acceptAllSafeAiSuggestions}
          onReviewConflicts={reviewConflicts}
          onDismissAll={dismissAllAiSuggestions}
        />
      )}

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
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t('inspection:form.selectHive')}
                      />
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
                          variant="outline"
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

                  <div className="mt-1 flex items-center gap-2">
                    <InspectionDateTimePicker
                      date={field.value ?? new Date()}
                      isAllDay={isAllDay}
                      onDateChange={field.onChange}
                      onIsAllDayChange={checked =>
                        form.setValue('isAllDay', checked)
                      }
                    />
                  </div>

                  {isInFuture && (
                    <div className="rounded p-4">
                      <strong className="text-blue-500">
                        {t('inspection:form.futureScheduled')}
                      </strong>
                      <p className="text-blue-500">
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
              <hr className="border-t border-border" />
              <AudioSection
                inspectionId={inspectionId}
                pendingRecordings={pendingRecordings}
                onPendingRecordingsChange={setPendingRecordings}
              />

              <hr className="border-t border-border" />
              <PhotosSection
                inspectionId={inspectionId}
                pendingPhotos={pendingPhotos}
                onPendingPhotosChange={setPendingPhotos}
              />

              <hr className="border-t border-border" />
              <WeatherSection
                isAiSuggested={isAiSuggested}
                aiMergeState={aiMergeState}
                onAcceptSuggestion={acceptAiSuggestion}
                onDismissSuggestion={dismissAiSuggestion}
              />

              <hr className="border-t border-border" />
              <ObservationsSection
                broodFrames={isSubjective ? null : totalFrames}
                broodBoxCount={isSubjective ? null : broodBoxCount}
                isSubjective={isSubjective}
                isAiSuggested={isAiSuggested}
                aiMergeState={aiMergeState}
                onAcceptSuggestion={acceptAiSuggestion}
                onDismissSuggestion={dismissAiSuggestion}
              />

              <hr className="border-t border-border" />
              {!isSubjective && (
                <>
                  <FrameCountSection
                    totalFrames={effectiveTotalFrames}
                    frameDelta={liveFrameDelta}
                    isAiSuggested={isAiSuggested}
                    aiMergeState={aiMergeState}
                    onAcceptSuggestion={acceptAiSuggestion}
                    onDismissSuggestion={dismissAiSuggestion}
                  />
                  <hr className="border-t border-border" />
                  <ScorePreviewSection
                    totalFrames={totalFrames}
                    isAiSuggested={isAiSuggested}
                    aiMergeState={aiMergeState}
                    onAcceptSuggestion={acceptAiSuggestion}
                    onDismissSuggestion={dismissAiSuggestion}
                  />
                  <hr className="border-t border-border" />
                </>
              )}

              <hr className="border-t border-border" />
              <ActionsSection
                hiveBoxes={selectedHive?.boxes ?? []}
                hiveId={selectedHive?.id}
                baseBroodFrames={baseBroodFrames}
                broodFrameCapacity={broodFrameCapacity}
                isAiSuggested={isAiSuggested}
                aiMergeState={aiMergeState}
                onAcceptSuggestion={acceptAiSuggestion}
                onDismissSuggestion={dismissAiSuggestion}
              />

              <hr className="border-t border-border" />
              <NotesSection
                isAiSuggested={isAiSuggested}
                aiMergeState={aiMergeState}
                onAcceptSuggestion={acceptAiSuggestion}
                onDismissSuggestion={dismissAiSuggestion}
              />
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
                  variant="default"
                  disabled={isSubmitting}
                  data-umami-event="Inspection Complete"
                >
                  {isSubmitting
                    ? t('inspection:form.saving')
                    : t('inspection:form.completeInspection')}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    variant="outline"
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                    data-umami-event="Inspection Save"
                  >
                    {isSubmitting
                      ? t('inspection:form.saving')
                      : t('inspection:form.save')}
                  </Button>
                  <Button
                    onClick={handleSaveAndComplete}
                    type="submit"
                    className="w-full"
                    variant="default"
                    disabled={isSubmitting}
                    data-umami-event="Inspection Complete"
                  >
                    {isSubmitting
                      ? t('inspection:form.saving')
                      : t('inspection:form.saveAndComplete')}
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
              {isSubmitting
                ? t('inspection:form.saving')
                : t('inspection:form.save')}
            </Button>
          )}
        </form>
      </Form>
    </div>
  );
};
