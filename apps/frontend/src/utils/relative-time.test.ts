import { describe, expect, it } from 'vitest';
import {
  daysAgo,
  formatRelativeDays,
  formatRelativeTime,
} from './relative-time';

const NOW = new Date(2026, 9, 15, 9, 0);

describe('formatRelativeDays', () => {
  it('counts calendar days, not 24 h periods', () => {
    const lastEvening = new Date(2026, 9, 14, 21, 0);
    expect(formatRelativeDays(lastEvening, 'en', NOW)).toBe('yesterday');
    expect(daysAgo(lastEvening, NOW)).toBe(1);
  });

  it('formats in the given language', () => {
    expect(formatRelativeDays(new Date(2026, 9, 10), 'en', NOW)).toBe(
      '5 days ago',
    );
    expect(formatRelativeDays(new Date(2026, 9, 15, 1), 'sk', NOW)).toBe(
      'dnes',
    );
  });
});

describe('formatRelativeTime', () => {
  it('picks the largest unit that fits', () => {
    const now = NOW.getTime();
    expect(formatRelativeTime(now - 3 * 3600_000, 'en', now)).toBe(
      '3 hours ago',
    );
    expect(formatRelativeTime(now - 125_000, 'en', now)).toBe('2 minutes ago');
    expect(formatRelativeTime(now - 10_000, 'en', now)).toBe('10 seconds ago');
    expect(formatRelativeTime(now + 2 * 86_400_000, 'en', now)).toBe(
      'in 2 days',
    );
  });

  it('returns null for an unparseable date', () => {
    expect(formatRelativeTime('not a date', 'en')).toBeNull();
  });
});
