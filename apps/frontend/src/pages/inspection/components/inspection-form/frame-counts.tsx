import React from 'react';
import { FieldPath, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { InspectionFormData } from './schema';
import { FRAME_FIELDS } from '@/constants/frame-fields';
import { AiFieldControls } from './ai-field-controls';
import type { AiMergeState } from '@/pages/inspection/lib/inspection-ai-merge';

type FrameCounterProps<T> = {
  name: T;
  label: string;
  color: string;
  totalFrames: number | null | undefined;
  /** Pre-computed composition percentage (already rounded via largest-remainder) */
  pct: number | null;
  // AI merge wiring (optional so the component still works without AI context)
  isAiSuggested?: (field: string) => boolean;
  aiMergeState?: AiMergeState | null;
  onAcceptSuggestion?: (field: string) => void;
  onDismissSuggestion?: (field: string) => void;
};

const FrameCounter = <TName extends FieldPath<InspectionFormData>>({
  name,
  label,
  color,
  totalFrames,
  pct,
  isAiSuggested,
  aiMergeState,
  onAcceptSuggestion,
  onDismissSuggestion,
}: FrameCounterProps<TName>) => {
  const { t } = useTranslation('inspection');
  const { control } = useFormContext<InspectionFormData>();
  const hasTotalFrames = totalFrames != null && totalFrames > 0;

  const fieldPath = name as string;
  const suggestion = isAiSuggested?.(fieldPath)
    ? aiMergeState?.suggestions[fieldPath]
    : undefined;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const currentValue = field.value as number | null | undefined;
        const maxValue = hasTotalFrames ? totalFrames : 999;

        const stopEvent = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
        };

        const decrement = (e: React.MouseEvent) => {
          stopEvent(e);
          field.onChange(Math.max(0, (currentValue ?? 0) - 1));
        };

        const increment = (e: React.MouseEvent) => {
          stopEvent(e);
          const nextValue = (currentValue ?? 0) + 1;
          // Each field can go up to totalFrames independently (overlapping is allowed)
          if (nextValue > maxValue) return;
          field.onChange(nextValue);
        };

        const canIncrement = (currentValue ?? 0) < maxValue;

        const clear = (e: React.MouseEvent) => {
          stopEvent(e);
          field.onChange(undefined);
        };

        return (
          <FormItem data-ai-field={fieldPath}>
            <div className="flex flex-col gap-1.5 p-3 rounded-xl border bg-card">
              {/* Label row */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                {currentValue != null && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={clear}
                    aria-label="Clear"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* AI suggestion controls */}
              {suggestion && (
                <AiFieldControls
                  isVisible
                  hasConflict={suggestion.hasConflict}
                  status={suggestion.status}
                  onAccept={() => onAcceptSuggestion?.(fieldPath)}
                  onDismiss={() => onDismissSuggestion?.(fieldPath)}
                />
              )}

              {/* Counter row */}
              <div className="flex items-center gap-3">
                {/* Minus button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-xl shrink-0 text-lg"
                  onClick={decrement}
                  disabled={currentValue == null || currentValue <= 0}
                  aria-label={`Decrease ${label}`}
                >
                  <Minus className="h-6 w-6" />
                </Button>

                {/* Count display — shows "count / total" (e.g. 1/16) with a
                    tooltip breaking down how many frames remain unassigned for
                    this type. Both update live as the +/- buttons change the
                    value. */}
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  {hasTotalFrames && currentValue != null ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-3xl font-bold tabular-nums leading-none cursor-default">
                          {currentValue}
                          <span className="text-base font-normal text-muted-foreground align-baseline">
                            /{totalFrames}
                          </span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('observations.frameCounts.framesUnassigned', {
                          count: totalFrames - currentValue,
                        })}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-3xl font-bold tabular-nums leading-none">
                      {currentValue ?? '—'}
                    </span>
                  )}
                  {pct != null && (
                    <span className="text-xs text-muted-foreground">
                      {pct}%
                    </span>
                  )}
                </div>

                {/* Plus button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-xl shrink-0 text-lg"
                  onClick={increment}
                  disabled={!canIncrement}
                  aria-label={`Increase ${label}`}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>

              {/* Composition progress bar — only shown when there is something to compare */}
              {pct != null && (
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

type FrameCountSectionProps = {
  totalFrames?: number | null;
  /** Net frames added (+) / removed (-) via the current Rähmchen action */
  frameDelta?: number;
  isAiSuggested?: (field: string) => boolean;
  aiMergeState?: AiMergeState | null;
  onAcceptSuggestion?: (field: string) => void;
  onDismissSuggestion?: (field: string) => void;
};

export const FrameCountSection: React.FC<FrameCountSectionProps> = ({
  totalFrames,
  frameDelta = 0,
  isAiSuggested,
  aiMergeState,
  onAcceptSuggestion,
  onDismissSuggestion,
}) => {
  const { t } = useTranslation('inspection');
  const { control } = useFormContext<InspectionFormData>();

  const frameTotalField = useWatch({
    name: 'observations.totalFrames',
    control,
  });

  // Watch all frame type values - call hooks at top level, not in a map
  const eggsFrames = useWatch({
    name: 'observations.eggsFrames',
    control,
  });
  const uncappedBroodFrames = useWatch({
    name: 'observations.uncappedBroodFrames',
    control,
  });
  const cappedBroodFrames = useWatch({
    name: 'observations.cappedBroodFrames',
    control,
  });
  const droneBroodFrames = useWatch({
    name: 'observations.droneBroodFrames',
    control,
  });
  const pollenFrames = useWatch({
    name: 'observations.pollenFrames',
    control,
  });
  const nectarFrames = useWatch({
    name: 'observations.nectarFrames',
    control,
  });
  const honeyFrames = useWatch({
    name: 'observations.honeyFrames',
    control,
  });
  const emptyFrames = useWatch({
    name: 'observations.emptyFrames',
    control,
  });

  const frameValues = [
    eggsFrames,
    uncappedBroodFrames,
    cappedBroodFrames,
    droneBroodFrames,
    pollenFrames,
    nectarFrames,
    honeyFrames,
    emptyFrames,
  ];

  // Prefer the live total passed from the form (brood-box frames adjusted by
  // the current Rähmchen action) over the stored observation value, so the
  // header and counter maximums always reflect the latest frame change.
  const effectiveTotalFrames = totalFrames ?? frameTotalField ?? null;

  // Ordered counts for all frame types — same order as FRAME_FIELDS
  const frameCounts = frameValues.map(v => v ?? 0);

  // Each frame type is shown as a share of the total frames (e.g. 1 of 10 →
  // 10%). Types overlap — a single frame can hold eggs and honey — so the
  // percentages are independent and intentionally need not sum to 100%.
  const pcts: (number | null)[] =
    effectiveTotalFrames != null && effectiveTotalFrames > 0
      ? frameCounts.map(c =>
          c > 0
            ? Math.min(100, Math.round((c / effectiveTotalFrames) * 100))
            : null,
        )
      : frameCounts.map(() => null);

  const frameTypes = FRAME_FIELDS.map(ff => ({
    name: `observations.${ff.obsKey}` as const,
    color: ff.tailwindColor,
  })) satisfies readonly {
    name: FieldPath<InspectionFormData>;
    color: string;
  }[];

  // totalFrames is shown only as the header (not a counter), so surface its
  // AI suggestion there.
  const totalFramesPath = 'observations.totalFrames';
  const totalFramesSuggestion = isAiSuggested?.(totalFramesPath)
    ? aiMergeState?.suggestions[totalFramesPath]
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center" data-ai-field={totalFramesPath}>
        <h3 className="text-lg font-medium">
          {t('observations.frameCounts.title')}
        </h3>
        <div className="flex items-center gap-2">
          {effectiveTotalFrames != null &&
            (frameDelta !== 0 ? (
              <span
                className="text-sm text-muted-foreground tabular-nums"
                title={t('observations.frameCounts.frameDeltaHint')}
              >
                {effectiveTotalFrames - frameDelta}{' '}
                <span
                  className={`font-semibold ${
                    frameDelta > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {frameDelta > 0 ? `+${frameDelta}` : frameDelta}
                </span>{' '}
                ={' '}
                {t('observations.frameCounts.totalFrames', {
                  count: effectiveTotalFrames,
                })}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                {t('observations.frameCounts.totalFrames', {
                  count: effectiveTotalFrames,
                })}
              </span>
            ))}
          {totalFramesSuggestion && (
            <AiFieldControls
              isVisible
              hasConflict={totalFramesSuggestion.hasConflict}
              status={totalFramesSuggestion.status}
              onAccept={() => onAcceptSuggestion?.(totalFramesPath)}
              onDismiss={() => onDismissSuggestion?.(totalFramesPath)}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {frameTypes.map(({ name, color }, i) => (
          <FrameCounter
            key={name}
            name={name}
            label={t(name)}
            color={color}
            totalFrames={effectiveTotalFrames}
            pct={pcts[i]}
            isAiSuggested={isAiSuggested}
            aiMergeState={aiMergeState}
            onAcceptSuggestion={onAcceptSuggestion}
            onDismissSuggestion={onDismissSuggestion}
          />
        ))}
      </div>
    </div>
  );
};
