import { useTranslation } from 'react-i18next';
import { Controller, useFormContext } from 'react-hook-form';
import { TapScale } from '../tap-scale';
import { FrameCounter } from '../frame-counter';
import { StepHeader } from '../step-header';
import type { InspectionFormData } from '@/pages/inspection/components/inspection-form/schema';

interface StoresStepProps {
  isSubjective: boolean;
  broodFrameCapacity?: number | null;
}

export function StoresStep({ isSubjective, broodFrameCapacity }: StoresStepProps) {
  const { t } = useTranslation('inspection');
  const { control } = useFormContext<InspectionFormData>();

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto pb-2">
      <StepHeader
        title={t('inspection:mobile.stores.title')}
        hint={t('inspection:mobile.stores.hint')}
      />

      <div className="space-y-4">
        <Controller
          control={control}
          name={
            isSubjective ? 'observations.honeyStores' : 'observations.honeyFrames'
          }
          render={({ field }) =>
            isSubjective ? (
              <TapScale
                value={field.value as number | null | undefined}
                onChange={field.onChange}
                label={t('inspection:observations.honeyStores')}
              />
            ) : (
              <FrameCounter
                value={field.value as number | null | undefined}
                onChange={field.onChange}
                max={broodFrameCapacity ?? undefined}
                label={t('inspection:observations.honeyStores')}
              />
            )
          }
        />

        <Controller
          control={control}
          name={
            isSubjective ? 'observations.pollenStores' : 'observations.pollenFrames'
          }
          render={({ field }) =>
            isSubjective ? (
              <TapScale
                value={field.value as number | null | undefined}
                onChange={field.onChange}
                label={t('inspection:observations.pollenStores')}
              />
            ) : (
              <FrameCounter
                value={field.value as number | null | undefined}
                onChange={field.onChange}
                max={broodFrameCapacity ?? undefined}
                label={t('inspection:observations.pollenStores')}
              />
            )
          }
        />
      </div>
    </div>
  );
}
