import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { CustomLoggerService } from '../logger/logger.service';
import {
  ApiaryStatisticsDto,
  ApiaryTrendsDto,
  ReportPeriod,
  TrendDataPoint,
} from './dto/apiary-statistics.dto';
import {
  HarvestStatus,
  HiveStatus,
  ObservationSchemaType,
} from 'shared-schemas';
import PDFDocument from 'pdfkit';

interface SyrupConcentration {
  sugarPerLiter: number;
}

const SYRUP_CONCENTRATIONS: Record<string, SyrupConcentration> = {
  '1:1': { sugarPerLiter: 660 },
  '2:1': { sugarPerLiter: 890 },
  '3:2': { sugarPerLiter: 750 },
};

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private metricsService: MetricsService,
    private logger: CustomLoggerService,
  ) {
    this.logger.setContext('ReportsService');
  }

  async getApiaryStatistics(
    apiaryId: string,
    userId: string,
    period: ReportPeriod = ReportPeriod.ALL,
  ): Promise<ApiaryStatisticsDto> {
    this.logger.log(
      `Getting statistics for apiary ${apiaryId}, period: ${period}`,
    );

    // Verify apiary ownership
    const apiary = await this.prisma.apiary.findFirst({
      where: {
        id: apiaryId,
        userId,
      },
    });

    if (!apiary) {
      this.logger.warn(`Apiary ${apiaryId} not found for user ${userId}`);
      throw new NotFoundException('Apiary not found or access denied');
    }

    const { startDate, endDate } = this.calculateDateRange(period);

    // Get all hives for the apiary
    const hives = await this.prisma.hive.findMany({
      where: {
        apiaryId,
      },
      include: {
        inspections: {
          where: {
            status: 'COMPLETED',
            ...(startDate
              ? { date: { gte: startDate, lte: endDate } }
              : { date: { lte: endDate } }),
          },
          orderBy: {
            date: 'desc',
          },
          include: {
            observations: true,
          },
        },
      },
    });

    const hiveIds = hives.map((h) => h.id);
    const totalHives = hives.length;
    const activeHives = hives.filter(
      (h) => h.status === HiveStatus.ACTIVE,
    ).length;

    // Calculate honey harvested per hive
    const honeyByHive = await this.calculateHoneyByHive(
      apiaryId,
      hiveIds,
      startDate,
      endDate,
      hives,
    );
    const totalHoneyKg = honeyByHive.reduce((sum, h) => sum + h.amount, 0);

    // Calculate sugar fed per hive
    const feedingByHive = await this.calculateFeedingByHive(
      hiveIds,
      startDate,
      endDate,
      hives,
    );
    const totalSugarKg = feedingByHive.reduce((sum, f) => sum + f.sugarKg, 0);

    // Calculate health scores per hive
    const healthByHive: Array<{
      hiveId: string;
      hiveName: string;
      overallScore: number | null;
      populationScore: number | null;
      storesScore: number | null;
      queenScore: number | null;
      lastInspectionDate: string | null;
    }> = [];

    let totalOverall = 0,
      totalPopulation = 0,
      totalStores = 0,
      totalQueen = 0;
    let countOverall = 0,
      countPopulation = 0,
      countStores = 0,
      countQueen = 0;

    // Count total inspections and harvests
    let totalInspections = 0;
    const harvestCount = await this.prisma.harvest.count({
      where: {
        apiaryId,
        status: HarvestStatus.COMPLETED,
        ...(startDate
          ? { date: { gte: startDate, lte: endDate } }
          : { date: { lte: endDate } }),
      },
    });

    for (const hive of hives) {
      // Count completed inspections for this hive
      const hiveInspectionCount = await this.prisma.inspection.count({
        where: {
          hiveId: hive.id,
          status: 'COMPLETED',
          ...(startDate
            ? { date: { gte: startDate, lte: endDate } }
            : { date: { lte: endDate } }),
        },
      });
      totalInspections += hiveInspectionCount;

      // Calculate scores from ALL completed inspections for this hive
      let hiveOverallSum = 0,
        hivePopulationSum = 0,
        hiveStoresSum = 0,
        hiveQueenSum = 0;
      let hiveOverallCount = 0,
        hivePopulationCount = 0,
        hiveStoresCount = 0,
        hiveQueenCount = 0;

      for (const inspection of hive.inspections) {
        if (inspection.observations.length > 0) {
          const observationMap = this.convertObservationsToMap(
            inspection.observations,
          );
          const scores =
            this.metricsService.calculateOveralScore(observationMap);

          if (scores.overallScore !== null) {
            hiveOverallSum += scores.overallScore;
            hiveOverallCount++;
          }
          if (scores.populationScore !== null) {
            hivePopulationSum += scores.populationScore;
            hivePopulationCount++;
          }
          if (scores.storesScore !== null) {
            hiveStoresSum += scores.storesScore;
            hiveStoresCount++;
          }
          if (scores.queenScore !== null) {
            hiveQueenSum += scores.queenScore;
            hiveQueenCount++;
          }
        }
      }

      // Per-hive averages
      const overallScore =
        hiveOverallCount > 0 ? hiveOverallSum / hiveOverallCount : null;
      const populationScore =
        hivePopulationCount > 0 ? hivePopulationSum / hivePopulationCount : null;
      const storesScore =
        hiveStoresCount > 0 ? hiveStoresSum / hiveStoresCount : null;
      const queenScore =
        hiveQueenCount > 0 ? hiveQueenSum / hiveQueenCount : null;

      // Add to apiary totals (one per hive)
      if (overallScore !== null) {
        totalOverall += overallScore;
        countOverall++;
      }
      if (populationScore !== null) {
        totalPopulation += populationScore;
        countPopulation++;
      }
      if (storesScore !== null) {
        totalStores += storesScore;
        countStores++;
      }
      if (queenScore !== null) {
        totalQueen += queenScore;
        countQueen++;
      }

      healthByHive.push({
        hiveId: hive.id,
        hiveName: hive.name,
        overallScore:
          overallScore !== null ? Math.round(overallScore * 100) / 100 : null,
        populationScore:
          populationScore !== null
            ? Math.round(populationScore * 100) / 100
            : null,
        storesScore:
          storesScore !== null ? Math.round(storesScore * 100) / 100 : null,
        queenScore:
          queenScore !== null ? Math.round(queenScore * 100) / 100 : null,
        lastInspectionDate: hive.inspections[0]?.date.toISOString() ?? null,
      });
    }

    return {
      apiaryId: apiary.id,
      apiaryName: apiary.name,
      period: {
        startDate: startDate
          ? startDate.toISOString()
          : new Date(0).toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalHives,
        activeHives,
        totalInspections,
        totalHarvests: harvestCount,
      },
      honeyProduction: {
        totalAmount: Math.round(totalHoneyKg * 100) / 100,
        unit: 'kg',
        byHive: honeyByHive,
      },
      feedingTotals: {
        totalSugarKg: Math.round(totalSugarKg * 100) / 100,
        byHive: feedingByHive,
      },
      healthScores: {
        averageOverall:
          countOverall > 0
            ? Math.round((totalOverall / countOverall) * 100) / 100
            : null,
        averagePopulation:
          countPopulation > 0
            ? Math.round((totalPopulation / countPopulation) * 100) / 100
            : null,
        averageStores:
          countStores > 0
            ? Math.round((totalStores / countStores) * 100) / 100
            : null,
        averageQueen:
          countQueen > 0
            ? Math.round((totalQueen / countQueen) * 100) / 100
            : null,
        byHive: healthByHive,
      },
    };
  }

  private async calculateHoneyByHive(
    apiaryId: string,
    hiveIds: string[],
    startDate: Date | null,
    endDate: Date,
    hives: Array<{ id: string; name: string }>,
  ): Promise<
    Array<{
      hiveId: string;
      hiveName: string;
      amount: number;
      unit: string;
      harvestCount: number;
    }>
  > {
    const harvests = await this.prisma.harvest.findMany({
      where: {
        apiaryId,
        status: HarvestStatus.COMPLETED,
        ...(startDate
          ? { date: { gte: startDate, lte: endDate } }
          : { date: { lte: endDate } }),
      },
      include: {
        harvestHives: {
          where: { hiveId: { in: hiveIds } },
        },
      },
    });

    const hiveHoneyMap = new Map<
      string,
      { amount: number; harvestCount: number }
    >();

    for (const harvest of harvests) {
      for (const hh of harvest.harvestHives) {
        const existing = hiveHoneyMap.get(hh.hiveId) || {
          amount: 0,
          harvestCount: 0,
        };
        if (hh.honeyAmount && hh.honeyAmountUnit) {
          existing.amount += this.convertToKg(
            hh.honeyAmount,
            hh.honeyAmountUnit,
          );
        }
        existing.harvestCount++;
        hiveHoneyMap.set(hh.hiveId, existing);
      }
    }

    return hives.map((hive) => {
      const data = hiveHoneyMap.get(hive.id) || { amount: 0, harvestCount: 0 };
      return {
        hiveId: hive.id,
        hiveName: hive.name,
        amount: Math.round(data.amount * 100) / 100,
        unit: 'kg',
        harvestCount: data.harvestCount,
      };
    });
  }

  private async calculateFeedingByHive(
    hiveIds: string[],
    startDate: Date | null,
    endDate: Date,
    hives: Array<{ id: string; name: string }>,
  ): Promise<
    Array<{
      hiveId: string;
      hiveName: string;
      sugarKg: number;
      feedingCount: number;
    }>
  > {
    const feedingActions = await this.prisma.action.findMany({
      where: {
        hiveId: { in: hiveIds },
        type: 'FEEDING',
        ...(startDate
          ? { date: { gte: startDate, lte: endDate } }
          : { date: { lte: endDate } }),
      },
      include: {
        feedingAction: true,
      },
    });

    const hiveFeedingMap = new Map<
      string,
      { sugarKg: number; feedingCount: number }
    >();

    for (const action of feedingActions) {
      if (action.feedingAction && action.hiveId) {
        const existing = hiveFeedingMap.get(action.hiveId) || {
          sugarKg: 0,
          feedingCount: 0,
        };
        existing.sugarKg +=
          this.calculateSugarFromFeeding(action.feedingAction) / 1000;
        existing.feedingCount++;
        hiveFeedingMap.set(action.hiveId, existing);
      }
    }

    return hives.map((hive) => {
      const data = hiveFeedingMap.get(hive.id) || {
        sugarKg: 0,
        feedingCount: 0,
      };
      return {
        hiveId: hive.id,
        hiveName: hive.name,
        sugarKg: Math.round(data.sugarKg * 100) / 100,
        feedingCount: data.feedingCount,
      };
    });
  }

  async getTrends(
    apiaryId: string,
    userId: string,
    period: ReportPeriod = ReportPeriod.ALL,
  ): Promise<ApiaryTrendsDto> {
    this.logger.log(`Getting trends for apiary ${apiaryId}, period: ${period}`);

    // Verify apiary ownership
    const apiary = await this.prisma.apiary.findFirst({
      where: {
        id: apiaryId,
        userId,
      },
    });

    if (!apiary) {
      this.logger.warn(`Apiary ${apiaryId} not found for user ${userId}`);
      throw new NotFoundException('Apiary not found or access denied');
    }

    const { startDate, endDate } = this.calculateDateRange(period);

    // Get all hives for the apiary
    const hives = await this.prisma.hive.findMany({
      where: {
        apiaryId,
      },
      select: {
        id: true,
      },
    });

    const hiveIds = hives.map((h) => h.id);

    // Get all harvests in the date range
    const harvests = await this.prisma.harvest.findMany({
      where: {
        apiaryId,
        status: HarvestStatus.COMPLETED,
        ...(startDate
          ? {
              date: {
                gte: startDate,
                lte: endDate,
              },
            }
          : {
              date: {
                lte: endDate,
              },
            }),
      },
      include: {
        harvestHives: {
          where: {
            hiveId: {
              in: hiveIds,
            },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Get all feeding actions in the date range
    const feedingActions = await this.prisma.action.findMany({
      where: {
        hiveId: {
          in: hiveIds,
        },
        type: 'FEEDING',
        ...(startDate
          ? {
              date: {
                gte: startDate,
                lte: endDate,
              },
            }
          : {
              date: {
                lte: endDate,
              },
            }),
      },
      include: {
        feedingAction: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Get all inspections in the date range
    const inspections = await this.prisma.inspection.findMany({
      where: {
        hiveId: {
          in: hiveIds,
        },
        ...(startDate
          ? {
              date: {
                gte: startDate,
                lte: endDate,
              },
            }
          : {
              date: {
                lte: endDate,
              },
            }),
      },
      include: {
        observations: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group data by month
    const trendsMap = new Map<string, TrendDataPoint>();

    // Process harvests
    for (const harvest of harvests) {
      const monthKey = this.getMonthKey(harvest.date);
      const point = this.getOrCreateTrendPoint(
        trendsMap,
        monthKey,
        harvest.date,
      );

      for (const harvestHive of harvest.harvestHives) {
        if (harvestHive.honeyAmount && harvestHive.honeyAmountUnit) {
          const honeyKg = this.convertToKg(
            harvestHive.honeyAmount,
            harvestHive.honeyAmountUnit,
          );
          point.honeyKg += honeyKg;
        }
      }
    }

    // Process feeding actions
    for (const action of feedingActions) {
      if (action.feedingAction) {
        const monthKey = this.getMonthKey(action.date);
        const point = this.getOrCreateTrendPoint(
          trendsMap,
          monthKey,
          action.date,
        );

        const sugarGrams = this.calculateSugarFromFeeding(action.feedingAction);
        point.sugarKg += sugarGrams / 1000;
      }
    }

    // Process inspections for health scores
    const inspectionsByMonth = new Map<
      string,
      (typeof inspections)[number][]
    >();
    for (const inspection of inspections) {
      const monthKey = this.getMonthKey(inspection.date);
      if (!inspectionsByMonth.has(monthKey)) {
        inspectionsByMonth.set(monthKey, []);
      }
      inspectionsByMonth.get(monthKey)?.push(inspection);
    }

    for (const [monthKey, monthInspections] of inspectionsByMonth) {
      const point = trendsMap.get(monthKey);
      if (!point) continue;

      point.inspectionCount = monthInspections.length;

      let totalScore = 0;
      let scoreCount = 0;

      for (const inspection of monthInspections) {
        if (inspection.observations.length > 0) {
          const observationMap = this.convertObservationsToMap(
            inspection.observations,
          );
          const scores =
            this.metricsService.calculateOveralScore(observationMap);
          if (scores.overallScore !== null) {
            totalScore += scores.overallScore;
            scoreCount++;
          }
        }
      }

      point.averageHealthScore =
        scoreCount > 0
          ? Math.round((totalScore / scoreCount) * 100) / 100
          : null;
    }

    // Convert map to sorted array
    const trends = Array.from(trendsMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((point) => ({
        ...point,
        honeyKg: Math.round(point.honeyKg * 100) / 100,
        sugarKg: Math.round(point.sugarKg * 100) / 100,
      }));

    return {
      apiaryId: apiary.id,
      apiaryName: apiary.name,
      period,
      dateRange: {
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate.toISOString(),
      },
      trends,
    };
  }

  private calculateDateRange(period: ReportPeriod): {
    startDate: Date | null;
    endDate: Date;
  } {
    const endDate = new Date();
    let startDate: Date | null = null;

    switch (period) {
      case ReportPeriod.ONE_MONTH:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case ReportPeriod.THREE_MONTHS:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case ReportPeriod.SIX_MONTHS:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case ReportPeriod.YTD:
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      case ReportPeriod.ONE_YEAR:
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case ReportPeriod.ALL:
        startDate = null;
        break;
    }

    return { startDate, endDate };
  }

  private calculateSugarFromFeeding(feedingAction: {
    feedType: string;
    amount: number;
    unit: string;
    concentration: string | null;
  }): number {
    const feedType = feedingAction.feedType.toUpperCase();
    let sugarGrams = 0;

    if (feedType === 'SYRUP') {
      // Convert to ml
      let amountMl = 0;
      switch (feedingAction.unit.toLowerCase()) {
        case 'ml':
          amountMl = feedingAction.amount;
          break;
        case 'l':
          amountMl = feedingAction.amount * 1000;
          break;
        case 'fl oz':
          amountMl = feedingAction.amount * 29.5735;
          break;
        case 'qt':
          amountMl = feedingAction.amount * 946.353;
          break;
        case 'gal':
          amountMl = feedingAction.amount * 3785.41;
          break;
        default:
          amountMl = feedingAction.amount * 1000; // Assume liters
      }

      const concentration = feedingAction.concentration || '1:1';
      const syrupConcentration = SYRUP_CONCENTRATIONS[concentration];
      if (syrupConcentration) {
        sugarGrams = (amountMl / 1000) * syrupConcentration.sugarPerLiter;
      } else {
        // Default to 1:1
        sugarGrams =
          (amountMl / 1000) * SYRUP_CONCENTRATIONS['1:1'].sugarPerLiter;
      }
    } else if (feedType === 'CANDY') {
      // Convert to grams
      let amountGrams = 0;
      switch (feedingAction.unit.toLowerCase()) {
        case 'g':
          amountGrams = feedingAction.amount;
          break;
        case 'kg':
          amountGrams = feedingAction.amount * 1000;
          break;
        case 'lb':
          amountGrams = feedingAction.amount * 453.592;
          break;
        default:
          amountGrams = feedingAction.amount * 1000; // Assume kg
      }
      sugarGrams = amountGrams; // Candy is pure sugar
    } else if (feedType === 'HONEY') {
      // Convert to grams
      let amountGrams = 0;
      switch (feedingAction.unit.toLowerCase()) {
        case 'g':
          amountGrams = feedingAction.amount;
          break;
        case 'kg':
          amountGrams = feedingAction.amount * 1000;
          break;
        case 'lb':
          amountGrams = feedingAction.amount * 453.592;
          break;
        default:
          amountGrams = feedingAction.amount * 1000; // Assume kg
      }
      sugarGrams = amountGrams * 0.8; // Honey is 80% sugar
    }

    return sugarGrams;
  }

  private convertToKg(amount: number, unit: string): number {
    switch (unit.toLowerCase()) {
      case 'kg':
        return amount;
      case 'lb':
        return amount * 0.453592;
      case 'g':
        return amount / 1000;
      default:
        return amount; // Assume kg
    }
  }

  private convertObservationsToMap(
    observations: {
      type: string;
      numericValue?: number | null;
      booleanValue?: boolean | null;
      textValue?: string | null;
    }[],
  ): ObservationSchemaType {
    const map: Record<string, number | boolean | string | null> = {};

    for (const obs of observations) {
      const type = obs.type;
      let value: number | boolean | string | null = null;

      if (obs.numericValue !== null && obs.numericValue !== undefined) {
        value = obs.numericValue;
      } else if (obs.booleanValue !== null && obs.booleanValue !== undefined) {
        value = obs.booleanValue;
      } else if (obs.textValue !== null && obs.textValue !== undefined) {
        value = obs.textValue;
      }

      map[type] = value;
    }

    // Map observation types to the format expected by MetricsService
    return {
      strength: (map.strength as number | null) ?? null,
      cappedBrood: (map.cappedBrood as number | null) ?? null,
      uncappedBrood: (map.uncappedBrood as number | null) ?? null,
      honeyStores: (map.honeyStores as number | null) ?? null,
      pollenStores: (map.pollenStores as number | null) ?? null,
      queenCells: (map.queenCells as number | null) ?? null,
      swarmCells: (map.swarmCells as boolean | null) ?? null,
      supersedureCells: (map.supersedureCells as boolean | null) ?? null,
      queenSeen: (map.queenSeen as boolean | null) ?? null,
    };
  }

  private getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private getOrCreateTrendPoint(
    trendsMap: Map<string, TrendDataPoint>,
    monthKey: string,
    _date: Date,
  ): TrendDataPoint {
    if (!trendsMap.has(monthKey)) {
      // Create a date for the first of the month
      const [year, month] = monthKey.split('-');
      const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);

      trendsMap.set(monthKey, {
        date: monthDate.toISOString(),
        honeyKg: 0,
        sugarKg: 0,
        averageHealthScore: null,
        inspectionCount: 0,
      });
    }
    return trendsMap.get(monthKey)!;
  }

  async exportCsv(
    apiaryId: string,
    userId: string,
    period: ReportPeriod = ReportPeriod.ALL,
  ): Promise<string> {
    this.logger.log(`Exporting CSV for apiary ${apiaryId}, period: ${period}`);

    const stats = await this.getApiaryStatistics(apiaryId, userId, period);

    // Helper function to escape CSV values
    const escapeCsv = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      if (
        stringValue.includes(',') ||
        stringValue.includes('"') ||
        stringValue.includes('\n')
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Build CSV content
    const lines: string[] = [];

    // Header section with apiary info
    lines.push(`Apiary Report - ${escapeCsv(stats.apiaryName)}`);
    lines.push(`Period: ${escapeCsv(period)}`);
    lines.push(
      `Date Range: ${escapeCsv(stats.period.startDate || 'All time')} to ${escapeCsv(stats.period.endDate)}`,
    );
    lines.push('');

    // Summary section
    lines.push('Summary');
    lines.push(`Total Hives,${stats.summary.totalHives}`);
    lines.push(`Active Hives,${stats.summary.activeHives}`);
    lines.push(`Total Inspections,${stats.summary.totalInspections}`);
    lines.push(`Total Harvests,${stats.summary.totalHarvests}`);
    lines.push(`Total Honey (kg),${stats.honeyProduction.totalAmount}`);
    lines.push(`Total Sugar Fed (kg),${stats.feedingTotals.totalSugarKg}`);
    lines.push(
      `Average Health Score,${stats.healthScores.averageOverall ?? 'N/A'}`,
    );
    lines.push('');

    // Per-hive details
    lines.push('Hive Details');
    lines.push(
      'Hive Name,Honey (kg),Sugar Fed (kg),Health Score,Last Inspection',
    );

    for (const hive of stats.healthScores.byHive) {
      const honeyData = stats.honeyProduction.byHive.find(
        (h) => h.hiveId === hive.hiveId,
      );
      const feedingData = stats.feedingTotals.byHive.find(
        (f) => f.hiveId === hive.hiveId,
      );
      lines.push(
        [
          escapeCsv(hive.hiveName),
          escapeCsv(honeyData?.amount ?? 0),
          escapeCsv(feedingData?.sugarKg ?? 0),
          escapeCsv(hive.overallScore ?? 'N/A'),
          escapeCsv(hive.lastInspectionDate ?? 'N/A'),
        ].join(','),
      );
    }

    return lines.join('\n');
  }

  async exportPdf(
    apiaryId: string,
    userId: string,
    period: ReportPeriod = ReportPeriod.ALL,
  ): Promise<Buffer> {
    this.logger.log(`Exporting PDF for apiary ${apiaryId}, period: ${period}`);

    const stats = await this.getApiaryStatistics(apiaryId, userId, period);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(24).text('Apiary Report', { align: 'center' });
      doc.moveDown();

      // Apiary info
      doc.fontSize(16).text(stats.apiaryName, { align: 'center' });
      doc.fontSize(10).text(`Period: ${period}`, { align: 'center' });
      const startDateFormatted = stats.period.startDate
        ? new Date(stats.period.startDate).toLocaleDateString()
        : 'All time';
      const endDateFormatted = new Date(
        stats.period.endDate,
      ).toLocaleDateString();
      doc.text(`Date Range: ${startDateFormatted} to ${endDateFormatted}`, {
        align: 'center',
      });
      doc.moveDown(2);

      // Summary section
      doc.fontSize(14).text('Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Total Hives: ${stats.summary.totalHives}`);
      doc.text(`Active Hives: ${stats.summary.activeHives}`);
      doc.text(`Total Inspections: ${stats.summary.totalInspections}`);
      doc.text(`Total Harvests: ${stats.summary.totalHarvests}`);
      doc.text(`Total Honey: ${stats.honeyProduction.totalAmount} kg`);
      doc.text(`Total Sugar Fed: ${stats.feedingTotals.totalSugarKg} kg`);
      doc.text(
        `Average Health Score: ${stats.healthScores.averageOverall ?? 'N/A'}`,
      );
      doc.moveDown(2);

      // Hive details section
      doc.fontSize(14).text('Hive Details', { underline: true });
      doc.moveDown(0.5);

      for (const hive of stats.healthScores.byHive) {
        const honeyData = stats.honeyProduction.byHive.find(
          (h) => h.hiveId === hive.hiveId,
        );
        const feedingData = stats.feedingTotals.byHive.find(
          (f) => f.hiveId === hive.hiveId,
        );

        doc.fontSize(12).text(hive.hiveName, { underline: true });
        doc.fontSize(10);
        doc.text(`  Honey: ${honeyData?.amount ?? 0} kg`);
        doc.text(`  Sugar Fed: ${feedingData?.sugarKg ?? 0} kg`);
        doc.text(`  Health Score: ${hive.overallScore ?? 'N/A'}`);
        const lastInspection = hive.lastInspectionDate
          ? new Date(hive.lastInspectionDate).toLocaleDateString()
          : 'N/A';
        doc.text(`  Last Inspection: ${lastInspection}`);
        doc.moveDown(0.5);
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).text(`Generated on ${new Date().toLocaleString()}`, {
        align: 'center',
      });

      doc.end();
    });
  }
}
