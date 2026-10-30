export type ScoreLevel = 'good' | 'fair' | 'poor';

export type ScoreThresholds = {
  /** Minimum value that counts as "good". */
  good: number;
  /** Minimum value that counts as "fair"; anything lower is "poor". */
  fair: number;
};

/** Thresholds for the calculated 0–10 hive scores. */
export const SCORE_LEVEL_THRESHOLDS: ScoreThresholds = { good: 6, fair: 3 };

/** Thresholds for the subjective 0–10 ratings shown on an inspection. */
export const RATING_LEVEL_THRESHOLDS: ScoreThresholds = { good: 7, fair: 4 };

export function getScoreLevel(
  value: number | null | undefined,
  thresholds: ScoreThresholds = SCORE_LEVEL_THRESHOLDS,
): ScoreLevel | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  if (value >= thresholds.good) return 'good';
  if (value >= thresholds.fair) return 'fair';
  return 'poor';
}

/**
 * Tailwind classes for each level. Colors come from the colorblind-safe
 * `--score-*` tokens; `text` uses the readable foreground shade and `bar`
 * the fill shade.
 */
export const scoreLevelStyles: Record<
  ScoreLevel,
  { text: string; bar: string }
> = {
  good: {
    text: 'text-score-good-foreground',
    bar: 'bg-score-good',
  },
  fair: {
    text: 'text-score-fair-foreground',
    bar: 'bg-score-fair',
  },
  poor: {
    text: 'text-score-poor-foreground',
    bar: 'bg-score-poor',
  },
};

export function getScoreLevelTextClass(
  value: number | null | undefined,
  thresholds: ScoreThresholds = SCORE_LEVEL_THRESHOLDS,
): string {
  const level = getScoreLevel(value, thresholds);
  return level ? scoreLevelStyles[level].text : 'text-muted-foreground';
}
