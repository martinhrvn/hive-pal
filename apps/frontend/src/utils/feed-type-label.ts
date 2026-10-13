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
