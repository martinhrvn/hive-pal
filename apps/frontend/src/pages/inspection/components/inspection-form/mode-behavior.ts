import type { InspectionFormData } from './schema';

const SUBJECTIVE_ONLY_OBSERVATION_FIELDS = [
  'cappedBrood',
  'uncappedBrood',
  'honeyStores',
  'pollenStores',
] as const satisfies readonly (keyof NonNullable<InspectionFormData['observations']>)[];

const DATA_DRIVEN_ONLY_OBSERVATION_FIELDS = [
  'totalFrames',
  'eggsFrames',
  'uncappedBroodFrames',
  'cappedBroodFrames',
  'droneBroodFrames',
  'pollenFrames',
  'nectarFrames',
  'honeyFrames',
  'emptyFrames',
] as const satisfies readonly (keyof NonNullable<InspectionFormData['observations']>)[];

const omitObservationFields = (
  observations: InspectionFormData['observations'] | undefined,
  keys: readonly (keyof NonNullable<InspectionFormData['observations']>)[],
): InspectionFormData['observations'] | undefined => {
  if (!observations) return observations;

  const nextObservations = { ...observations };

  keys.forEach(key => {
    delete nextObservations[key];
  });

  return nextObservations;
};

export const getModeSpecificObservations = (
  observations: InspectionFormData['observations'] | undefined,
  isSubjective: boolean,
  totalFrames?: number | null,
): InspectionFormData['observations'] | undefined => {
  if (!observations) return observations;

  if (isSubjective) {
    return omitObservationFields(
      observations,
      DATA_DRIVEN_ONLY_OBSERVATION_FIELDS,
    );
  }

  const dataDrivenObservations = omitObservationFields(
    observations,
    SUBJECTIVE_ONLY_OBSERVATION_FIELDS,
  );

  if (!dataDrivenObservations) return dataDrivenObservations;

  if (totalFrames == null) return dataDrivenObservations;

  return {
    ...dataDrivenObservations,
    totalFrames,
  };
};

export const applyInspectionModeToFormData = (
  data: InspectionFormData,
  isSubjective: boolean,
  totalFrames?: number | null,
): InspectionFormData => ({
  ...data,
  observations: getModeSpecificObservations(
    data.observations,
    isSubjective,
    totalFrames,
  ),
  score: isSubjective ? undefined : data.score,
});
