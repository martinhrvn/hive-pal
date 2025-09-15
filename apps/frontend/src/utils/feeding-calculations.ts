import { ActionResponse } from 'shared-schemas';

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
  autumnSugarKg: number;
  autumnSyrupLiters: number;
}

export interface HiveSettings {
  autumnFeeding?: {
    startMonth: number;
    endMonth: number;
    amountKg: number;
  };
  inspection?: {
    frequencyDays: number;
  };
}

/**
 * Check if current date is within the feeding window
 */
export function isWithinFeedingWindow(hiveSettings?: HiveSettings): boolean {
  const currentMonth = new Date().getMonth() + 1; // 1-based month
  const startMonth = hiveSettings?.autumnFeeding?.startMonth ?? 8;
  const endMonth = hiveSettings?.autumnFeeding?.endMonth ?? 10;

  return currentMonth >= startMonth && currentMonth <= endMonth;
}

/**
 * Calculate sugar content from syrup feeding
 */
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

/**
 * Calculate feeding totals from actions
 */
export function calculateFeedingTotals(
  actions: ActionResponse[],
  hiveSettings?: HiveSettings,
): FeedingTotals {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-based month

  // Use hive settings for autumn feeding window, with fallback to defaults
  const autumnStartMonth = hiveSettings?.autumnFeeding?.startMonth ?? 8;
  const autumnEndMonth = hiveSettings?.autumnFeeding?.endMonth ?? 10;
  const isAfterAutumnStart = currentMonth >= autumnStartMonth;

  let totalSugarGrams = 0;
  let totalSyrupMl = 0;
  let currentYearSugarGrams = 0;
  let currentYearSyrupMl = 0;
  let autumnSugarGrams = 0;
  let autumnSyrupMl = 0;

  const feedingActions = actions.filter(
    action => action.type === 'FEEDING' && action.details?.type === 'FEEDING',
  );

  feedingActions.forEach(action => {
    if (action.details?.type !== 'FEEDING') return;

    const actionDate = new Date(action.date);
    const actionYear = actionDate.getFullYear();
    const actionMonth = actionDate.getMonth() + 1;

    const details = action.details;
    let sugarGrams = 0;
    let syrupMl = 0;

    // Calculate based on feed type
    if (details.feedType === 'SYRUP' || details.feedType === 'Syrup') {
      // Convert amount to ml (normalize all volume units)
      let amountMl = 0;
      switch (details.unit) {
        case 'ml':
          amountMl = details.amount;
          break;
        case 'L':
          amountMl = details.amount * 1000;
          break;
        case 'fl oz':
          amountMl = details.amount * 29.5735; // 1 fl oz = 29.5735 ml
          break;
        case 'qt':
          amountMl = details.amount * 946.353; // 1 qt = 946.353 ml
          break;
        case 'gal':
          amountMl = details.amount * 3785.41; // 1 gal = 3785.41 ml
          break;
        default:
          // Fallback: assume liters if unit is unknown
          amountMl = details.amount * 1000;
      }
      syrupMl = amountMl;
      sugarGrams = calculateSugarFromSyrup(
        amountMl,
        details.concentration || '1:1',
      );
    } else if (details.feedType === 'CANDY' || details.feedType === 'Candy') {
      // Convert candy weight to grams
      let amountGrams = 0;
      switch (details.unit) {
        case 'g':
          amountGrams = details.amount;
          break;
        case 'kg':
          amountGrams = details.amount * 1000;
          break;
        case 'lb':
          amountGrams = details.amount * 453.592; // 1 lb = 453.592 g
          break;
        default:
          // Fallback: assume kg if unit is unknown
          amountGrams = details.amount * 1000;
      }
      sugarGrams = amountGrams; // Candy is pure sugar
    } else if (details.feedType === 'HONEY' || details.feedType === 'Honey') {
      // Convert honey weight to grams and calculate sugar content
      let amountGrams = 0;
      switch (details.unit) {
        case 'g':
          amountGrams = details.amount;
          break;
        case 'kg':
          amountGrams = details.amount * 1000;
          break;
        case 'lb':
          amountGrams = details.amount * 453.592; // 1 lb = 453.592 g
          break;
        default:
          // Fallback: assume kg if unit is unknown
          amountGrams = details.amount * 1000;
      }
      sugarGrams = amountGrams * 0.8; // Honey is approximately 80% sugar
    }

    // Add to totals
    totalSugarGrams += sugarGrams;
    totalSyrupMl += syrupMl;

    // Add to current year totals
    if (actionYear === currentYear) {
      currentYearSugarGrams += sugarGrams;
      currentYearSyrupMl += syrupMl;

      // Add to autumn totals (within autumn feeding window)
      if (actionMonth >= autumnStartMonth && actionMonth <= autumnEndMonth) {
        autumnSugarGrams += sugarGrams;
        autumnSyrupMl += syrupMl;
      }
    } else if (
      actionYear === currentYear - 1 &&
      actionMonth >= autumnStartMonth &&
      actionMonth <= autumnEndMonth &&
      !isAfterAutumnStart
    ) {
      // If we're before autumn start this year, include last year's autumn feeding
      autumnSugarGrams += sugarGrams;
      autumnSyrupMl += syrupMl;
    }
  });

  return {
    totalSugarKg: totalSugarGrams / 1000,
    totalSyrupLiters: totalSyrupMl / 1000,
    currentYearSugarKg: currentYearSugarGrams / 1000,
    currentYearSyrupLiters: currentYearSyrupMl / 1000,
    autumnSugarKg: autumnSugarGrams / 1000,
    autumnSyrupLiters: autumnSyrupMl / 1000,
  };
}
