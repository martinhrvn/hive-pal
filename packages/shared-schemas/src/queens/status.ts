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
