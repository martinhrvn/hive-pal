import { z } from 'zod';

/**
 * Comb-cell classes produced by the DeepBee model, in the order it predicts.
 * Used as the keys of the counts / percentages records below.
 */
export const FRAME_CELL_CLASSES = [
  'egg',
  'larvae',
  'cappedBrood',
  'honey',
  'pollen',
  'nectar',
  'other',
] as const;

export type FrameCellClass = (typeof FRAME_CELL_CLASSES)[number];

const cellCountsSchema = z.object({
  egg: z.number().int().nonnegative(),
  larvae: z.number().int().nonnegative(),
  cappedBrood: z.number().int().nonnegative(),
  honey: z.number().int().nonnegative(),
  pollen: z.number().int().nonnegative(),
  nectar: z.number().int().nonnegative(),
  other: z.number().int().nonnegative(),
});

const cellPercentagesSchema = z.object({
  egg: z.number().min(0).max(100),
  larvae: z.number().min(0).max(100),
  cappedBrood: z.number().min(0).max(100),
  honey: z.number().min(0).max(100),
  pollen: z.number().min(0).max(100),
  nectar: z.number().min(0).max(100),
  other: z.number().min(0).max(100),
});

/** Raw stats as returned by the frame-ai container. */
export const frameAnalysisResultSchema = z.object({
  totalCells: z.number().int().nonnegative(),
  counts: cellCountsSchema,
  percentages: cellPercentagesSchema,
  modelVersion: z.string(),
});

export type FrameAnalysisResult = z.infer<typeof frameAnalysisResultSchema>;

/** What the backend returns to the frontend for a single photo's analysis. */
export const frameAnalysisResponseSchema = frameAnalysisResultSchema.extend({
  photoId: z.string().uuid(),
  analyzedAt: z.string().datetime(),
});

export type FrameAnalysisResponse = z.infer<typeof frameAnalysisResponseSchema>;
