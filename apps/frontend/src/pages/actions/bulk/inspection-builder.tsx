import { forwardRef, useImperativeHandle } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Separator } from '@/components/ui/separator';
import { ObservationsSection } from '@/pages/inspection/components/inspection-form/observations';
import { WeatherSection } from '@/pages/inspection/components/inspection-form/weather';
import { NotesSection } from '@/pages/inspection/components/inspection-form/notes';
import { ActionsSection } from '@/pages/inspection/components/inspection-form/actions';
import type { InspectionFormData } from '@/pages/inspection/components/inspection-form/schema';
import type { BulkInspectionPayload, StagedItem } from './types';
import type { BuilderHandle } from './action-builder';

// We back the builder with the full InspectionFormData shape (no resolver) so
// the existing section components keep working unchanged. Validation runs at
// the API boundary instead.
const defaultValues: Partial<InspectionFormData> = {
  observations: {},
  actions: [],
};

const isPayloadEmpty = (payload: BulkInspectionPayload): boolean => {
  const obs = payload.observations ?? {};
  const hasObservations = Object.values(obs).some(
    v => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0),
  );
  return (
    !hasObservations &&
    !payload.notes &&
    payload.temperature == null &&
    !payload.weatherConditions &&
    (payload.actions?.length ?? 0) === 0
  );
};

export const InspectionBuilder = forwardRef<BuilderHandle>((_, ref) => {
  const methods = useForm<InspectionFormData>({
    defaultValues: defaultValues as InspectionFormData,
  });

  useImperativeHandle(ref, () => ({
    buildItems: (hives, date) => {
      const values = methods.getValues();
      const payload: BulkInspectionPayload = {
        observations: values.observations,
        temperature: values.temperature ?? null,
        weatherConditions: values.weatherConditions ?? null,
        notes: values.notes ?? null,
        actions: values.actions,
      };
      if (isPayloadEmpty(payload)) return [];
      return hives.map((hive): StagedItem => ({
        kind: 'inspection',
        id: `${hive.id}-inspection-${Date.now()}-${Math.random()}`,
        hiveId: hive.id,
        hiveName: hive.name,
        date,
        inspection: {
          ...payload,
          observations: payload.observations
            ? { ...payload.observations }
            : undefined,
          actions: payload.actions?.map(a => ({ ...a })),
        },
      }));
    },
    reset: () => methods.reset(defaultValues as InspectionFormData),
    itemCount: () => {
      const values = methods.getValues();
      return isPayloadEmpty({
        observations: values.observations,
        temperature: values.temperature ?? null,
        weatherConditions: values.weatherConditions ?? null,
        notes: values.notes ?? null,
        actions: values.actions,
      })
        ? 0
        : 1;
    },
  }));

  return (
    <FormProvider {...methods}>
      <form onSubmit={e => e.preventDefault()} className="space-y-4">
        <WeatherSection />
        <Separator />
        {/* Subjective mode: exposes cappedBrood/uncappedBrood/honeyStores/
            pollenStores as 0-10 ratings. Data-driven mode would replace these
            with per-hive frame counts, which can't be applied uniformly across
            multiple hives. */}
        <ObservationsSection
          broodFrames={null}
          broodBoxCount={null}
          isSubjective
        />
        <Separator />
        <ActionsSection hiveBoxes={[]} disableBoxConfig />
        <Separator />
        <NotesSection />
      </form>
    </FormProvider>
  );
});

InspectionBuilder.displayName = 'InspectionBuilder';
