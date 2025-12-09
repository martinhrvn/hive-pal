export enum ReportPeriod {
  ONE_MONTH = '1month',
  THREE_MONTHS = '3months',
  SIX_MONTHS = '6months',
  YTD = 'ytd',
  ONE_YEAR = '1year',
  ALL = 'all',
}

export interface HiveHoney {
  hiveId: string;
  hiveName: string;
  amount: number;
  unit: string;
  harvestCount: number;
}

export interface HiveFeeding {
  hiveId: string;
  hiveName: string;
  sugarKg: number;
  feedingCount: number;
}

export interface HiveHealth {
  hiveId: string;
  hiveName: string;
  overallScore: number | null;
  populationScore: number | null;
  storesScore: number | null;
  queenScore: number | null;
  lastInspectionDate: string | null;
}

export interface ApiaryStatisticsDto {
  apiaryId: string;
  apiaryName: string;
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalHives: number;
    activeHives: number;
    totalInspections: number;
    totalHarvests: number;
  };
  honeyProduction: {
    totalAmount: number;
    unit: string;
    byHive: HiveHoney[];
  };
  feedingTotals: {
    totalSugarKg: number;
    byHive: HiveFeeding[];
  };
  healthScores: {
    averageOverall: number | null;
    averagePopulation: number | null;
    averageStores: number | null;
    averageQueen: number | null;
    byHive: HiveHealth[];
  };
}

export interface TrendDataPoint {
  date: string;
  honeyKg: number;
  sugarKg: number;
  averageHealthScore: number | null;
  inspectionCount: number;
}

export interface ApiaryTrendsDto {
  apiaryId: string;
  apiaryName: string;
  period: ReportPeriod;
  dateRange: {
    startDate: string | null;
    endDate: string;
  };
  trends: TrendDataPoint[];
}
