import { Injectable } from '@nestjs/common';
import { ObservationSchemaType } from 'shared-schemas';

@Injectable()
export class MetricsService {
  WARNING_CONFIGURATION: ((
    metric: ObservationSchemaType,
  ) => string | undefined)[] = [
    (metric) =>
      metric.cappedBrood === 0 && metric.uncappedBrood === 0
        ? 'no_brood'
        : undefined,
    (metric) =>
      metric.swarmCells && metric.queenCells && metric.queenCells > 0
        ? 'swarm_preparation'
        : undefined,
    (metric) =>
      metric.supersedureCells && metric.queenCells && metric.queenCells > 0
        ? 'supersedure'
        : undefined,
  ];

  calculateOveralScore(inspectionMetrics: ObservationSchemaType): {
    overallScore: number | null;
    populationScore: number | null;
    storesScore: number | null;
    queenScore: number | null;
    warnings: string[];
    confidence: number;
  } {
    const populationScore = this.calculateWeightedScore([
      { value: inspectionMetrics.strength, weight: 2 },
      { value: inspectionMetrics.cappedBrood, weight: 1 },
      { value: inspectionMetrics.uncappedBrood, weight: 1 },
    ]);
    const storesScore = this.calculateWeightedScore([
      { value: inspectionMetrics.honeyStores, weight: 2 },
      { value: inspectionMetrics.pollenStores, weight: 1 },
    ]);

    const queenScore = this.calculateWeightedScore([
      {
        value:
          inspectionMetrics.queenCells !== null &&
          inspectionMetrics.queenCells !== undefined
            ? 10 - Math.min(inspectionMetrics.queenCells, 10)
            : null,
        weight: 2,
      },
      { value: inspectionMetrics.cappedBrood, weight: 2 },
      { value: inspectionMetrics.uncappedBrood, weight: 2 },
      {
        value: this.booleanToNumber(inspectionMetrics.swarmCells, 0, 10),
        weight: 1,
      },
      {
        value: this.booleanToNumber(inspectionMetrics.supersedureCells, 0, 10),
        weight: 1,
      },
      {
        value: this.booleanToNumber(inspectionMetrics.queenSeen, 10, 0),
        weight: 1,
      },
    ]);

    const overallScore = this.calculateWeightedScore([
      { value: populationScore, weight: 2 },
      { value: storesScore, weight: 1 },
      { value: queenScore, weight: 1 },
    ]);
    const warnings = this.WARNING_CONFIGURATION.flatMap((f) =>
      f(inspectionMetrics),
    ).filter((i) => i !== undefined);

    const confidence =
      [populationScore, queenScore, storesScore].filter(
        (score) => score !== null,
      ).length / 3;

    return {
      overallScore: this.roundToTwoDecimals(overallScore),
      populationScore: this.roundToTwoDecimals(populationScore),
      storesScore: this.roundToTwoDecimals(storesScore),
      queenScore: this.roundToTwoDecimals(queenScore),

      warnings,
      confidence,
    };
  }

  booleanToNumber(
    value: boolean | null | undefined,
    trueValue: number,
    falseValue: number,
  ): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    return value ? trueValue : falseValue;
  }

  roundToTwoDecimals(value: number | null): number | null {
    if (value === null) {
      return null;
    }
    return parseFloat(value.toFixed(2));
  }

  calculateWeightedScore(
    values: { value: number | null | undefined; weight: number }[],
  ): number | null {
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
}
