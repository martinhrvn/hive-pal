import { ObservationSchemaType } from './observations.schema';

export type ScoreResult = {
  overallScore: number | null;
  populationScore: number | null;
  storesScore: number | null;
  queenScore: number | null;
  warnings: string[];
  confidence: number;
};

type WeightedValue = { value: number | null | undefined; weight: number };

const WARNING_CHECKS: ((metric: ObservationSchemaType) => string | undefined)[] = [
  (metric) => {
    const hasFrameBroodData =
      metric.eggsFrames != null ||
      metric.uncappedBroodFrames != null ||
      metric.cappedBroodFrames != null;

    if (hasFrameBroodData) {
      const broodFrameTotal =
        (metric.eggsFrames ?? 0) +
        (metric.uncappedBroodFrames ?? 0) +
        (metric.cappedBroodFrames ?? 0);

      return broodFrameTotal === 0 ? 'no_brood' : undefined;
    }

    return metric.cappedBrood === 0 && metric.uncappedBrood === 0
      ? 'no_brood'
      : undefined;
  },
  (metric) =>
    metric.swarmCells && metric.queenCells && metric.queenCells > 0
      ? 'swarm_preparation'
      : undefined,
  (metric) =>
    metric.supersedureCells && metric.queenCells && metric.queenCells > 0
      ? 'supersedure'
      : undefined,
];

export function booleanToNumber(
  value: boolean | null | undefined,
  trueValue: number,
  falseValue: number,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value ? trueValue : falseValue;
}

export function roundToTwoDecimals(value: number | null): number | null {
  if (value === null) {
    return null;
  }
  return parseFloat(value.toFixed(2));
}

export function calculateWeightedScore(values: WeightedValue[]): number | null {
  if (values.every(({ value }) => value === null || value === undefined)) {
    return null;
  }

  const weightedSum = values.reduce((acc, { value, weight }) => {
    if (value === null || value === undefined) {
      return acc;
    }
    return acc + value * weight;
  }, 0);

  const totalWeight = values.reduce(
    (acc, { weight, value }) =>
      value !== undefined && value !== null ? acc + weight : acc,
    0,
  );

  if (totalWeight === 0) {
    return null;
  }
  return weightedSum / totalWeight;
}

function framePercentageToScore(frames: number, totalFrames: number): number {
  if (totalFrames <= 0) return 0;
  return Math.min(10, (frames / totalFrames) * 10);
}

export function calculateScores(observations: ObservationSchemaType): ScoreResult {
  const totalFrames = observations.totalFrames;
  const hasFrameData =
    totalFrames != null &&
    totalFrames > 0 &&
    (observations.eggsFrames != null ||
      observations.uncappedBroodFrames != null ||
      observations.cappedBroodFrames != null ||
      observations.pollenFrames != null ||
      observations.nectarFrames != null ||
      observations.honeyFrames != null);

  let populationScore: number | null;
  let storesScore: number | null;

  if (hasFrameData && totalFrames != null && totalFrames > 0) {
    const broodFrames =
      (observations.eggsFrames ?? 0) +
      (observations.uncappedBroodFrames ?? 0) +
      (observations.cappedBroodFrames ?? 0);
    const storesFrames =
      (observations.honeyFrames ?? 0) +
      (observations.nectarFrames ?? 0) +
      (observations.pollenFrames ?? 0);

    populationScore =
      observations.eggsFrames != null ||
      observations.uncappedBroodFrames != null ||
      observations.cappedBroodFrames != null
        ? framePercentageToScore(broodFrames, totalFrames)
        : calculateWeightedScore([
            { value: observations.strength, weight: 2 },
            { value: observations.cappedBrood, weight: 1 },
            { value: observations.uncappedBrood, weight: 1 },
          ]);

    storesScore =
      observations.honeyFrames != null ||
      observations.nectarFrames != null ||
      observations.pollenFrames != null
        ? framePercentageToScore(storesFrames, totalFrames)
        : calculateWeightedScore([
            { value: observations.honeyStores, weight: 2 },
            { value: observations.pollenStores, weight: 1 },
          ]);
  } else {
    populationScore = calculateWeightedScore([
      { value: observations.strength, weight: 2 },
      { value: observations.cappedBrood, weight: 1 },
      { value: observations.uncappedBrood, weight: 1 },
    ]);

    storesScore = calculateWeightedScore([
      { value: observations.honeyStores, weight: 2 },
      { value: observations.pollenStores, weight: 1 },
    ]);
  }

  const queenScore = calculateWeightedScore([
    {
      value:
        observations.queenCells !== null && observations.queenCells !== undefined
          ? 10 - Math.min(observations.queenCells, 10)
          : null,
      weight: 2,
    },
    { value: observations.cappedBrood, weight: 2 },
    { value: observations.uncappedBrood, weight: 2 },
    { value: booleanToNumber(observations.swarmCells, 0, 10), weight: 1 },
    { value: booleanToNumber(observations.supersedureCells, 0, 10), weight: 1 },
    { value: booleanToNumber(observations.queenSeen, 10, 0), weight: 1 },
  ]);

  const overallScore = calculateWeightedScore([
    { value: populationScore, weight: 2 },
    { value: storesScore, weight: 1 },
    { value: queenScore, weight: 1 },
  ]);

  const warnings = WARNING_CHECKS.flatMap((f) => f(observations)).filter(
    (i): i is string => i !== undefined,
  );

  const confidence =
    [populationScore, queenScore, storesScore].filter(
      (score) => score !== null,
    ).length / 3;

  return {
    overallScore: roundToTwoDecimals(overallScore),
    populationScore: roundToTwoDecimals(populationScore),
    storesScore: roundToTwoDecimals(storesScore),
    queenScore: roundToTwoDecimals(queenScore),
    warnings,
    confidence,
  };
}
