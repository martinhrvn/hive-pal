import { z } from 'zod';

export const queenStatusSchema = z.enum([
  'VIRGIN',
  'ACTIVE',
  'REPLACED',
  'DEAD',
  'UNKNOWN',
]);

export type QueenStatus = z.infer<typeof queenStatusSchema>;

// Statuses of a hive's current queen: a virgin queen still heads the colony.
export const CURRENT_QUEEN_STATUSES = [
  'ACTIVE',
  'VIRGIN',
] as const satisfies readonly QueenStatus[];

export const isCurrentQueenStatus = (status: QueenStatus | null | undefined) =>
  status === 'ACTIVE' || status === 'VIRGIN';

/** Moving into a hive makes a queen its laying queen, unless still a virgin. */
export const queenStatusOnInstall = (status: QueenStatus): QueenStatus =>
  status === 'VIRGIN' ? 'VIRGIN' : 'ACTIVE';

export const queenMatingTypeSchema = z.enum([
  'OPEN',
  'INSTRUMENTAL',
  'MATING_STATION',
]);

export type QueenMatingType = z.infer<typeof queenMatingTypeSchema>;

// Queen rearing timings, in days
export const QUEEN_CELL_CAPPED_TO_EMERGENCE_DAYS = 8;
// A virgin queen usually mates by about day 20 and is laying soon after.
export const VIRGIN_QUEEN_CHECK_DAYS = 21;

const DAY_MS = 24 * 60 * 60 * 1000;

type DateLike = Date | string;
const toDate = (value: DateLike) => new Date(value);

/**
 * When a virgin queen's clock starts: her emergence date, else the expected
 * emergence from the capped cell, else when she was recorded as a virgin.
 */
export const virginQueenSince = (queen: {
  emergedAt?: DateLike | null;
  cellCappedAt?: DateLike | null;
  statusChangedAt: DateLike;
}): Date => {
  if (queen.emergedAt) return toDate(queen.emergedAt);
  if (queen.cellCappedAt) {
    return new Date(
      toDate(queen.cellCappedAt).getTime() +
        QUEEN_CELL_CAPPED_TO_EMERGENCE_DAYS * DAY_MS,
    );
  }
  return toDate(queen.statusChangedAt);
};
