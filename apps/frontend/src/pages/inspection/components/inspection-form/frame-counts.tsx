import React from 'react';
import { FieldPath, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { InspectionFormData } from './schema';
import { largestRemainder } from '@/utils/math';

type FrameCounterProps<T> = {
  name: T;
  label: string;
  color: string;
  totalFrames: number | null | undefined;
  /** Pre-computed composition percentage (already rounded via largest-remainder) */
  pct: number | null;
};

const FrameCounter = <TName extends FieldPath<InspectionFormData>>({
  name,
  label,
  color,
  totalFrames,
  pct,
}: FrameCounterProps<TName>) => {
  const { control } = useFormContext<InspectionFormData>();
  const hasTotalFrames = totalFrames != null && totalFrames > 0;

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
          <FormItem>
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

                {/* Count display */}
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-3xl font-bold tabular-nums leading-none">
                    {currentValue ?? '—'}
                  </span>
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
};

export const FrameCountSection: React.FC<FrameCountSectionProps> = ({
  totalFrames,
}) => {
  const { t } = useTranslation('inspection');
  const { control } = useFormContext<InspectionFormData>();

  const frameTotalField = useWatch({
    name: 'observations.totalFrames',
    control,
  });

  // Watch all frame type values
  const eggsFrames        = useWatch({ name: 'observations.eggsFrames',         control });
  const uncappedBroodFrames = useWatch({ name: 'observations.uncappedBroodFrames', control });
  const cappedBroodFrames = useWatch({ name: 'observations.cappedBroodFrames',  control });
  const droneBroodFrames  = useWatch({ name: 'observations.droneBroodFrames',   control });
  const pollenFrames      = useWatch({ name: 'observations.pollenFrames',       control });
  const nectarFrames      = useWatch({ name: 'observations.nectarFrames',       control });
  const honeyFrames       = useWatch({ name: 'observations.honeyFrames',        control });
  const emptyFrames       = useWatch({ name: 'observations.emptyFrames',        control });

  const effectiveTotalFrames = frameTotalField ?? totalFrames ?? null;

  // Ordered counts for all frame types — same order as frameTypes below
  const frameCounts = [
    eggsFrames ?? 0,
    uncappedBroodFrames ?? 0,
    cappedBroodFrames ?? 0,
    droneBroodFrames ?? 0,
    pollenFrames ?? 0,
    nectarFrames ?? 0,
    honeyFrames ?? 0,
    emptyFrames ?? 0,
  ];

  // Calculate percentages based on the sum of all entered counts
  // Shows distribution: eggs=4, capped=4, sum=8 → each is 50%
  // Percentages always sum to exactly 100%
  const pcts: (number | null)[] =
    frameCounts.reduce((a, b) => a + b, 0) > 0
      ? largestRemainder(frameCounts, frameCounts.reduce((a, b) => a + b, 0)).map((p, i) =>
          frameCounts[i] > 0 ? p : null,
        )
      : frameCounts.map(() => null);

  const frameTypes = [
    { name: 'observations.eggsFrames' as const, color: 'bg-yellow-400' },
    { name: 'observations.uncappedBroodFrames' as const, color: 'bg-orange-400' },
    { name: 'observations.cappedBroodFrames' as const, color: 'bg-amber-600' },
    { name: 'observations.droneBroodFrames' as const, color: 'bg-amber-800' },
    { name: 'observations.pollenFrames' as const, color: 'bg-green-500' },
    { name: 'observations.nectarFrames' as const, color: 'bg-orange-500' },
    { name: 'observations.honeyFrames' as const, color: 'bg-yellow-500' },
    { name: 'observations.emptyFrames' as const, color: 'bg-slate-300' },
  ] as const satisfies readonly { name: FieldPath<InspectionFormData>; color: string }[];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          {t('observations.frameCounts.title')}
        </h3>
        {effectiveTotalFrames != null && (
          <span className="text-sm text-muted-foreground">
            {t('observations.frameCounts.totalFrames', {
              count: effectiveTotalFrames,
            })}
          </span>
        )}
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
          />
        ))}
      </div>
    </div>
  );
};
