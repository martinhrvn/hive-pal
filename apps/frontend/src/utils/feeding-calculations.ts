import {
  findRelevantFeedingSeason,
  getEffectiveSeasons,
  type ActionResponse,
  type ApiarySeasonSettings,
  type HiveSeasonSettings,
  type Season,
  type SeasonSource,
  type SeasonWindow,
} from 'shared-schemas';

export interface SyrupConcentration {
  ratio: string;
  sugarPercentage: number;
  sugarPerLiter: number; // in grams
}

export const SYRUP_CONCENTRATIONS: Record<string, SyrupConcentration> = {
  '1:1': {
    ratio: '1:1',
    sugarPercentage: 66,
    sugarPerLiter: 660,
  },
  '2:1': {
    ratio: '2:1',
    sugarPercentage: 89,
    sugarPerLiter: 890,
  },
  '3:2': {
    ratio: '3:2',
    sugarPercentage: 75,
    sugarPerLiter: 750,
  },
};

export interface FeedingTotals {
  totalSugarKg: number;
  totalSyrupLiters: number;
  currentYearSugarKg: number;
  currentYearSyrupLiters: number;
}

export interface FeedingInWindow {
  sugarKg: number;
  syrupLiters: number;
}

export interface FeedingSeasonProgress {
  season: Season;
  source: SeasonSource;
  window: SeasonWindow;
  isActive: boolean;
  sugarKg: number;
  syrupLiters: number;
  targetKg: number;
  percentage: number;
  remainingKg: number;
}

/** Calculate sugar content from syrup feeding. */
export function calculateSugarFromSyrup(
  amountMl: number,
  concentration: string,
): number {
  const syrupConcentration = SYRUP_CONCENTRATIONS[concentration];
  if (!syrupConcentration) {
    console.warn(`Unknown concentration: ${concentration}, defaulting to 1:1`);
    return (amountMl / 1000) * SYRUP_CONCENTRATIONS['1:1'].sugarPerLiter;
  }

  // Convert ml to liters and multiply by sugar per liter
  return (amountMl / 1000) * syrupConcentration.sugarPerLiter;
}

type FeedingDetails = Extract<
  NonNullable<ActionResponse['details']>,
  { type: 'FEEDING' }
>;

interface ActionFeedingAmount {
  sugarGrams: number;
  syrupMl: number;
}

function volumeToMl(amount: number, unit: string): number {
  if (unit === 'ml') return amount;
  if (unit === 'L') return amount * 1000;
  if (unit === 'fl oz') return amount * 29.5735;
  if (unit === 'qt') return amount * 946.353;
  if (unit === 'gal') return amount * 3785.41;
  // Legacy records may have no or an unknown unit: assume liters, as before.
  return amount * 1000;
}

function legacySugarGrams(details: FeedingDetails, syrupMl: number): number {
  switch (details.feedType) {
    case 'SYRUP':
    case 'Syrup':
      return calculateSugarFromSyrup(
        syrupMl || details.amount * 1000,
        details.concentration || '1:1',
      );
    case 'CANDY':
    case 'Candy':
      return massToGrams(details.amount, details.unit);
    case 'HONEY':
    case 'Honey':
      return massToGrams(details.amount, details.unit) * 0.8;
    default:
      return 0;
  }
}

/**
 * Sugar and syrup amounts for one feeding action. Prefers the sugar mass
 * stored on v2 feeding records (which also covers custom feed types); falls
 * back to the legacy concentration-based calculation for old records.
 */
function actionFeedingAmount(details: FeedingDetails): ActionFeedingAmount {
  const isSyrup = details.feedType === 'SYRUP' || details.feedType === 'Syrup';
  const syrupMl = isSyrup ? volumeToMl(details.amount, details.unit) : 0;
  const sugarGrams =
    typeof details.sugarG === 'number'
      ? details.sugarG
      : legacySugarGrams(details, syrupMl);
  return { sugarGrams, syrupMl };
}

function massToGrams(amount: number, unit: string): number {
  switch (unit) {
    case 'g':
      return amount;
    case 'kg':
      return amount * 1000;
    case 'lb':
      return amount * 453.592;
    default:
      return amount * 1000;
  }
}

function accumulate(
  actions: ActionResponse[],
  matches: (date: Date) => boolean,
): ActionFeedingAmount {
  let sugarGrams = 0;
  let syrupMl = 0;
  for (const action of actions) {
    if (action.type !== 'FEEDING' || action.details?.type !== 'FEEDING') {
      continue;
    }
    if (!matches(new Date(action.date))) continue;
    const amount = actionFeedingAmount(action.details);
    sugarGrams += amount.sugarGrams;
    syrupMl += amount.syrupMl;
  }
  return { sugarGrams, syrupMl };
}

/** Year totals across all feedings (used by the hive detail summary). */
export function calculateFeedingTotals(
  actions: ActionResponse[],
): FeedingTotals {
  const currentYear = new Date().getFullYear();
  const all = accumulate(actions, () => true);
  const current = accumulate(
    actions,
    date => date.getFullYear() === currentYear,
  );

  return {
    totalSugarKg: all.sugarGrams / 1000,
    totalSyrupLiters: all.syrupMl / 1000,
    currentYearSugarKg: current.sugarGrams / 1000,
    currentYearSyrupLiters: current.syrupMl / 1000,
  };
}

/** Feeding totals inside an inclusive date window (a season's occurrence). */
export function calculateFeedingTotalsInWindow(
  actions: ActionResponse[],
  start: Date,
  end: Date,
): FeedingInWindow {
  const totals = accumulate(actions, date => date >= start && date <= end);
  return {
    sugarKg: totals.sugarGrams / 1000,
    syrupLiters: totals.syrupMl / 1000,
  };
}

/**
 * Feeding progress toward the active feeding season's target, or toward the
 * most recently completed feeding season when none is active. Returns null
 * when the hive has no feeding season at all.
 */
export function getFeedingSeasonProgress(
  actions: ActionResponse[],
  hiveSettings?: HiveSeasonSettings | null,
  apiarySettings?: ApiarySeasonSettings | null,
  now: Date = new Date(),
): FeedingSeasonProgress | null {
  const { seasons, source } = getEffectiveSeasons(hiveSettings, apiarySettings);
  const relevant = findRelevantFeedingSeason(seasons, now);
  if (!relevant) return null;

  const targetKg = relevant.season.feeding.targetKg ?? 0;
  const totals = calculateFeedingTotalsInWindow(
    actions,
    relevant.window.start,
    relevant.window.end,
  );
  const percentage =
    targetKg > 0 ? Math.min((totals.sugarKg / targetKg) * 100, 100) : 0;

  return {
    season: relevant.season,
    source,
    window: relevant.window,
    isActive: relevant.isActive,
    sugarKg: totals.sugarKg,
    syrupLiters: totals.syrupLiters,
    targetKg,
    percentage,
    remainingKg: Math.max(targetKg - totals.sugarKg, 0),
  };
}
