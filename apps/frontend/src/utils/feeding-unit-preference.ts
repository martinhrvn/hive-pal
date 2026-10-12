import { FEED_ENTRY_UNITS, FeedEntryUnit } from 'shared-schemas';

/**
 * Remembers the entry unit last used when logging a feeding, per feed type
 * (kg for the Apiinvert bucket, L for homemade syrup, …), with a global
 * "last used anywhere" fallback for types fed for the first time.
 * Stored in localStorage; failures degrade to the built-in defaults.
 */

const STORAGE_KEY = 'hive_pal_feeding_units';
/** Map key for the cross-type fallback entry. */
const LAST_USED = '__last__';

type StoredUnits = Record<string, string>;

const readStored = (): StoredUnits => {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return parsed && typeof parsed === 'object' ? (parsed as StoredUnits) : {};
  } catch {
    return {};
  }
};

const isFeedEntryUnit = (value: unknown): value is FeedEntryUnit =>
  typeof value === 'string' &&
  (FEED_ENTRY_UNITS as readonly string[]).includes(value);

/**
 * The remembered unit for a feed type: the type's own last-used unit first,
 * then the unit last used with any feed. Returns null when nothing (valid)
 * is stored — callers then fall back to the feed's default.
 */
export const getPreferredFeedUnit = (
  feedTypeId: string | null | undefined,
): FeedEntryUnit | null => {
  const stored = readStored();
  const candidate =
    (feedTypeId != null ? stored[feedTypeId] : undefined) ?? stored[LAST_USED];
  return isFeedEntryUnit(candidate) ? candidate : null;
};

/** Persists the unit a feeding was saved with (per type + global fallback). */
export const saveFeedUnitPreference = (
  feedTypeId: string | null | undefined,
  unit: FeedEntryUnit,
): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    const stored = readStored();
    if (feedTypeId != null) stored[feedTypeId] = unit;
    stored[LAST_USED] = unit;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    /* storage unavailable — the preference is a convenience only */
  }
};
