import { useTranslation } from 'react-i18next';
import { Controller, useFormContext } from 'react-hook-form';
import { TapScale } from '../tap-scale';
import { FrameCounter } from '../frame-counter';
import { StepHeader } from '../step-header';
import type { InspectionFormData } from '@/pages/inspection/components/inspection-form/schema';

interface VitalsStepProps {
  isSubjective: boolean;
  broodFrameCapacity?: number | null;
}

export function VitalsStep({
  isSubjective,
  broodFrameCapacity,
}: VitalsStepProps) {
  const { t } = useTranslation('inspection');
  const { control } = useFormContext<InspectionFormData>();

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto pb-2">
      <StepHeader
        title={t('inspection:mobile.vitals.title')}
        hint={t('inspection:mobile.vitals.hint')}
      />

      <div className="space-y-4">
        <Controller
          control={control}
          name="observations.strength"
          render={({ field }) =>
            isSubjective ? (
              <TapScale
                value={field.value}
                onChange={field.onChange}
                label={t('inspection:observations.strength')}
              />
            ) : (
              <FrameCounter
                value={field.value}
                onChange={field.onChange}
                label={t('inspection:observations.strength')}
              />
            )
          }
        />

        <Controller
          control={control}
          name={
            isSubjective
              ? 'observations.cappedBrood'
              : 'observations.cappedBroodFrames'
          }
          render={({ field }) =>
            isSubjective ? (
              <TapScale
                value={field.value as number | null | undefined}
                onChange={field.onChange}
                label={t('inspection:observations.cappedBrood')}
              />
            ) : (
              <FrameCounter
                value={field.value as number | null | undefined}
                onChange={field.onChange}
                max={broodFrameCapacity ?? undefined}
                label={t('inspection:observations.cappedBrood')}
              />
            )
          }
        />

        <Controller
          control={control}
          name={
            isSubjective
              ? 'observations.uncappedBrood'
              : 'observations.uncappedBroodFrames'
          }
          render={({ field }) =>
            isSubjective ? (
              <TapScale
                value={field.value as number | null | undefined}
                onChange={field.onChange}
                label={t('inspection:observations.uncappedBrood')}
              />
            ) : (
              <FrameCounter
                value={field.value as number | null | undefined}
                onChange={field.onChange}
                max={broodFrameCapacity ?? undefined}
                label={t('inspection:observations.uncappedBrood')}
              />
            )
          }
        />
      </div>
    </div>
  );
}
