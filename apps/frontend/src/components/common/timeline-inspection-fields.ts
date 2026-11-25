import type { InspectionResponse } from 'shared-schemas';
import { FRAME_FIELDS } from '@/constants/frame-fields';

type Observations = NonNullable<InspectionResponse['observations']>;

export const NUMERIC_KEYS = [
  'strength',
  'uncappedBrood',
  'cappedBrood',
  'honeyStores',
  'pollenStores',
  'queenCells',
] as const satisfies ReadonlyArray<keyof Observations>;

export const SCORE_KEYS = [
  ['overallScore', 'overall'],
  ['populationScore', 'population'],
  ['storesScore', 'stores'],
  ['queenScore', 'queen'],
] as const;

const hasObservationDetails = (obs: Observations | undefined): boolean => {
  if (!obs) return false;
  return (
    NUMERIC_KEYS.some(key => obs[key] != null) ||
    FRAME_FIELDS.some(field => (obs[field.obsKey] ?? 0) > 0) ||
    obs.swarmCells != null ||
    obs.supersedureCells != null ||
    !!obs.broodPattern ||
    (obs.additionalObservations?.length ?? 0) > 0 ||
    (obs.reminderObservations?.length ?? 0) > 0
  );
};

const hasScores = (score: InspectionResponse['score']): boolean =>
  !!score && SCORE_KEYS.some(([key]) => score[key] != null);

/** Whether the expanded panel would show anything beyond the collapsed row. */
export const hasInspectionDetails = (inspection: InspectionResponse): boolean =>
  !!inspection.notes ||
  inspection.temperature != null ||
  !!inspection.weatherConditions ||
  hasScores(inspection.score) ||
  hasObservationDetails(inspection.observations);
