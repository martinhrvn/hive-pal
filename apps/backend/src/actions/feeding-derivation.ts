import {
  ActionType,
  CreateAction,
  FEED_ENTRY_UNITS,
  FeedEntryUnit,
  feedAmountToGrams,
  feedSugarGrams,
  getBuiltinFeedType,
  legacyFeedToBuiltinId,
} from 'shared-schemas';

export type FeedingDetails = Extract<
  CreateAction['details'],
  { type: ActionType.FEEDING }
>;

/** Density (g/ml, null for solid feeds) and % sugar w/w of a feed type. */
export interface FeedSpecValues {
  density: number | null;
  sugarContent: number;
}

/**
 * The built-in feed type a feeding refers to: its feedTypeId, a feedType
 * naming a built-in id (SYRUP_1_1), or a legacy feedType + concentration
 * (SYRUP + 3:2). Undefined for custom and free-text feeds.
 */
export const builtinFeedTypeId = (
  details: FeedingDetails,
): string | undefined => {
  if (details.feedTypeId) {
    return getBuiltinFeedType(details.feedTypeId)?.id;
  }
  const named = getBuiltinFeedType(details.feedType.trim().toUpperCase());
  return (
    named?.id ?? legacyFeedToBuiltinId(details.feedType, details.concentration)
  );
};

const toEntryUnit = (unit: string): FeedEntryUnit | undefined => {
  const normalized = unit.trim().toLowerCase();
  return FEED_ENTRY_UNITS.find((u) => u === normalized);
};

/**
 * Fills the v2 feeding fields the web app computes on the client, so feedings
 * from API and MCP clients that only send feedType/amount/unit still get the
 * canonical amountG and sugarG that reports add up. Client-sent density and
 * sugar content win over the feed type's spec; amountG and sugarG are always
 * recomputed when the inputs allow it.
 */
export function deriveFeeding(
  details: FeedingDetails,
  spec: FeedSpecValues | undefined,
) {
  const enteredAmount = details.enteredAmount ?? details.amount;
  const enteredUnit = details.enteredUnit ?? toEntryUnit(details.unit);
  const density = details.density ?? spec?.density ?? undefined;
  const sugarContent = details.sugarContent ?? spec?.sugarContent;
  const amountG =
    (enteredUnit && feedAmountToGrams(enteredAmount, enteredUnit, density)) ??
    details.amountG;
  const sugarG =
    amountG != null && sugarContent != null
      ? feedSugarGrams(amountG, sugarContent)
      : details.sugarG;
  return { enteredAmount, enteredUnit, density, sugarContent, amountG, sugarG };
}
