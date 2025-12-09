import { z } from 'zod';

// Period filter for reports
export const reportPeriodSchema = z.enum(['1month', '3months', '6months', 'ytd', '1year', 'all']);
export type ReportPeriod = z.infer<typeof reportPeriodSchema>;

// Per-hive honey data
export const hiveHoneySchema = z.object({
  hiveId: z.string().uuid(),
  hiveName: z.string(),
  amount: z.number(),
  unit: z.string(),
  harvestCount: z.number(),
});

// Per-hive feeding data
export const hiveFeedingSchema = z.object({
  hiveId: z.string().uuid(),
  hiveName: z.string(),
  sugarKg: z.number(),
  feedingCount: z.number(),
});

// Per-hive health data
export const hiveHealthSchema = z.object({
  hiveId: z.string().uuid(),
  hiveName: z.string(),
  overallScore: z.number().nullable(),
  populationScore: z.number().nullable(),
  storesScore: z.number().nullable(),
  queenScore: z.number().nullable(),
  lastInspectionDate: z.string().nullable(),
});

// Main statistics response
export const apiaryStatisticsSchema = z.object({
  apiaryId: z.string().uuid(),
  apiaryName: z.string(),
  period: z.object({
    startDate: z.string(),
    endDate: z.string(),
  }),
  summary: z.object({
    totalHives: z.number(),
    activeHives: z.number(),
    totalInspections: z.number(),
    totalHarvests: z.number(),
  }),
  honeyProduction: z.object({
    totalAmount: z.number(),
    unit: z.string(),
    byHive: z.array(hiveHoneySchema),
  }),
  feedingTotals: z.object({
    totalSugarKg: z.number(),
    byHive: z.array(hiveFeedingSchema),
  }),
  healthScores: z.object({
    averageOverall: z.number().nullable(),
    averagePopulation: z.number().nullable(),
    averageStores: z.number().nullable(),
    averageQueen: z.number().nullable(),
    byHive: z.array(hiveHealthSchema),
  }),
});

export type ApiaryStatistics = z.infer<typeof apiaryStatisticsSchema>;

// Trend data for charts
export const healthTrendPointSchema = z.object({
  date: z.string(),
  averageOverall: z.number().nullable(),
  averagePopulation: z.number().nullable(),
  averageStores: z.number().nullable(),
  averageQueen: z.number().nullable(),
});

export const feedingTrendPointSchema = z.object({
  weekStart: z.string(),
  sugarKg: z.number(),
});

export const harvestTrendPointSchema = z.object({
  date: z.string(),
  amount: z.number(),
  unit: z.string(),
});

export const trendDataSchema = z.object({
  apiaryId: z.string().uuid(),
  period: z.object({
    startDate: z.string(),
    endDate: z.string(),
  }),
  healthTrends: z.array(healthTrendPointSchema),
  feedingTrends: z.array(feedingTrendPointSchema),
  harvestTrends: z.array(harvestTrendPointSchema),
});

export type TrendData = z.infer<typeof trendDataSchema>;

// Export all types
export type HiveHoney = z.infer<typeof hiveHoneySchema>;
export type HiveFeeding = z.infer<typeof hiveFeedingSchema>;
export type HiveHealth = z.infer<typeof hiveHealthSchema>;
export type HealthTrendPoint = z.infer<typeof healthTrendPointSchema>;
export type FeedingTrendPoint = z.infer<typeof feedingTrendPointSchema>;
export type HarvestTrendPoint = z.infer<typeof harvestTrendPointSchema>;
