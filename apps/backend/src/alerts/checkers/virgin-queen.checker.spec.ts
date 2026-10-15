import { HiveContext } from '../interfaces';
import { VIRGIN_QUEEN_CHECK_DAYS } from 'shared-schemas';
import { VirginQueenChecker } from './virgin-queen.checker';

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date('2026-06-30T02:00:00Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * DAY_MS);

const hiveWith = (
  queen: Partial<NonNullable<HiveContext['currentQueen']>> | null,
): HiveContext => ({
  hiveId: 'hive-1',
  name: 'Hive 01',
  settings: null,
  status: 'ACTIVE',
  currentQueen: queen && {
    id: 'queen-1',
    name: 'Bella',
    marking: null,
    year: 2026,
    status: 'VIRGIN',
    statusChangedAt: daysAgo(VIRGIN_QUEEN_CHECK_DAYS),
    cellCappedAt: null,
    emergedAt: null,
    ...queen,
  },
});

describe('VirginQueenChecker', () => {
  const checker = new VirginQueenChecker();
  const check = (hive: HiveContext) =>
    checker.checkHive(hive, {
      userId: 'system',
      apiaryId: 'apiary-1',
      currentTime: now,
    });

  it('reminds to check for eggs once a queen has been virgin for 3 weeks', () => {
    const [issue] = check(hiveWith({}));

    expect(issue).toMatchObject({
      type: 'virgin_queen',
      severity: 'MEDIUM',
      metadata: { queenId: 'queen-1', daysVirgin: 21 },
    });
    expect(issue.message).toBe(
      'Check for eggs: Bella in hive "Hive 01" has been a virgin queen for 21 days',
    );
  });

  it('stays quiet before the threshold', () => {
    expect(
      check(
        hiveWith({ statusChangedAt: daysAgo(VIRGIN_QUEEN_CHECK_DAYS - 1) }),
      ),
    ).toEqual([]);
  });

  it('counts from the emergence date when there is one', () => {
    const queen = {
      statusChangedAt: daysAgo(30),
      cellCappedAt: daysAgo(40),
      emergedAt: daysAgo(VIRGIN_QUEEN_CHECK_DAYS - 1),
    };
    expect(check(hiveWith(queen))).toEqual([]);
  });

  it('counts from the expected emergence of a capped cell', () => {
    // Capped 29 days ago: emerged about 21 days ago
    const [issue] = check(
      hiveWith({ statusChangedAt: daysAgo(5), cellCappedAt: daysAgo(29) }),
    );
    expect(issue.metadata).toMatchObject({ daysVirgin: 21 });
  });

  it('ignores laying queens and queenless hives', () => {
    expect(check(hiveWith({ status: 'ACTIVE' }))).toEqual([]);
    expect(check(hiveWith(null))).toEqual([]);
  });

  it('falls back to the year when the queen has no name or marking', () => {
    const [issue] = check(hiveWith({ name: null }));
    expect(issue.message).toContain('Queen 2026 in hive');
  });
});
