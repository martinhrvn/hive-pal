import { describe, expect, it } from 'vitest';
import {
  getScoreLevel,
  getScoreLevelTextClass,
  RATING_LEVEL_THRESHOLDS,
  SCORE_LEVEL_THRESHOLDS,
  scoreLevelStyles,
} from './score-level';

describe('getScoreLevel', () => {
  it('returns null for missing values', () => {
    expect(getScoreLevel(null)).toBeNull();
    expect(getScoreLevel(undefined)).toBeNull();
    expect(getScoreLevel(Number.NaN)).toBeNull();
  });

  it('uses the calculated-score thresholds by default', () => {
    expect(getScoreLevel(SCORE_LEVEL_THRESHOLDS.good)).toBe('good');
    expect(getScoreLevel(SCORE_LEVEL_THRESHOLDS.fair)).toBe('fair');
    expect(getScoreLevel(SCORE_LEVEL_THRESHOLDS.fair - 0.1)).toBe('poor');
  });

  it('uses the rating thresholds for subjective ratings', () => {
    expect(getScoreLevel(7, RATING_LEVEL_THRESHOLDS)).toBe('good');
    expect(getScoreLevel(6.9, RATING_LEVEL_THRESHOLDS)).toBe('fair');
    expect(getScoreLevel(4, RATING_LEVEL_THRESHOLDS)).toBe('fair');
    expect(getScoreLevel(3.9, RATING_LEVEL_THRESHOLDS)).toBe('poor');
  });

  it('maps levels to their token classes and falls back to muted', () => {
    expect(getScoreLevelTextClass(8)).toBe(scoreLevelStyles.good.text);
    expect(getScoreLevelTextClass(4)).toBe(scoreLevelStyles.fair.text);
    expect(getScoreLevelTextClass(1)).toBe(scoreLevelStyles.poor.text);
    expect(getScoreLevelTextClass(null)).toBe('text-muted-foreground');
  });
});
