import { z } from 'zod';

export const queenStatusSchema = z.enum([
  'ACTIVE',
  'REPLACED',
  'DEAD',
  'UNKNOWN',
]);

export type QueenStatus = z.infer<typeof queenStatusSchema>;
export const queenMatingTypeSchema = z.enum([
  'OPEN',
  'INSTRUMENTAL',
  'MATING_STATION',
]);

export type QueenMatingType = z.infer<typeof queenMatingTypeSchema>;
