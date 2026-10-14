import type { QueenStatus } from 'shared-schemas';
import type { StatusTone } from '@/components/common/status-pill';

export const QUEEN_STATUSES = [
  'VIRGIN',
  'ACTIVE',
  'REPLACED',
  'DEAD',
  'UNKNOWN',
] as const satisfies readonly QueenStatus[];

export const QUEEN_STATUS_TONE: Record<QueenStatus, StatusTone> = {
  VIRGIN: 'info',
  ACTIVE: 'success',
  REPLACED: 'neutral',
  DEAD: 'danger',
  UNKNOWN: 'warning',
};

/** i18n key under the `queen` namespace, e.g. `status.active`. */
export const queenStatusLabelKey = (status: QueenStatus) =>
  `status.${status.toLowerCase()}` as const;

// Real marking paint colours, not theme tokens.
export const QUEEN_COLOR_CLASSES: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  indigo: 'bg-indigo-500',
  pink: 'bg-pink-500',
  gray: 'bg-gray-500',
  black: 'bg-black',
  white: 'bg-white',
};

export const QUEEN_COLORS = Object.keys(QUEEN_COLOR_CLASSES);

export const getQueenColorClass = (
  color: string | null | undefined,
  fallback = 'bg-muted',
): string => {
  if (!color) return fallback;
  return QUEEN_COLOR_CLASSES[color.toLowerCase()] ?? fallback;
};

// International marking scheme, indexed by the last digit of the year.
const YEAR_DIGIT_COLORS = [
  'blue',
  'white',
  'yellow',
  'red',
  'green',
  'blue',
  'white',
  'yellow',
  'red',
  'green',
] as const;

export const getQueenColorForYear = (
  year: number | null | undefined,
): string | null => {
  if (year == null || !Number.isInteger(year) || year < 0) return null;
  return YEAR_DIGIT_COLORS[year % 10];
};

export const getQueenDisplayName = (
  t: (key: string, options: { year: number | string }) => string,
  queen: {
    name?: string | null;
    marking?: string | null;
    year?: number | null;
  },
): string =>
  queen.name ||
  queen.marking ||
  t('queen:fallbackName', { year: queen.year ?? '—' });
