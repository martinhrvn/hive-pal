// Maps a stored feedType to a display label. New records store the label
// itself; legacy records store ids like SYRUP/POLLEN_PATTY.
const LEGACY_FEED_TYPE_LABELS: Record<string, string> = {
  SYRUP: 'Syrup',
  HONEY: 'Honey',
  CANDY: 'Candy',
  PROTEIN_CANDY: 'Protein Candy',
  POLLEN_PATTY: 'Pollen Patty',
  OTHER: 'Other',
};

export const getFeedTypeLabel = (feedType: string): string =>
  LEGACY_FEED_TYPE_LABELS[feedType] ?? feedType;

const displayUnit = (unit: string): string => (unit === 'l' ? 'L' : unit);

// v2 feeding records show what was entered; legacy records the stored value.
export const getFeedingAmountLabel = (details: {
  amount: number;
  unit: string;
  enteredAmount?: number | null;
  enteredUnit?: string | null;
}): string =>
  details.enteredAmount != null && details.enteredUnit
    ? `${details.enteredAmount} ${displayUnit(details.enteredUnit)}`
    : `${details.amount} ${details.unit}`;
