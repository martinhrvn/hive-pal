import { z } from 'zod';

export const metricNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9_]+$/, 'metric must be lowercase snake_case');

/** Canonical metric name under which manual hive weights are stored. */
export const WEIGHT_METRIC = 'weight';

/**
 * Side of the hive where the scale was applied for a manual weight reading.
 * FRONT is the entrance (Flugloch) side. A null side means a whole-hive
 * weighing rather than a one-sided reading.
 */
export const measurementSideSchema = z.enum(['FRONT', 'BACK', 'LEFT', 'RIGHT']);

export type MeasurementSide = z.infer<typeof measurementSideSchema>;

export const measurementInputSchema = z.object({
  metric: metricNameSchema,
  value: z.number().finite(),
  unit: z.string().max(16).optional(),
  recordedAt: z.string().datetime().optional(),
  source: z.string().max(128).optional(),
  // Optional position within the hive (see measurementSideSchema / boxId docs).
  boxId: z.string().uuid().nullish(),
  side: measurementSideSchema.nullish(),
});

export type MeasurementInput = z.infer<typeof measurementInputSchema>;

export const createMeasurementBatchSchema = z.object({
  measurements: z.array(measurementInputSchema).min(1).max(500),
});

export type CreateMeasurementBatch = z.infer<
  typeof createMeasurementBatchSchema
>;

export const createMeasurementBatchResponseSchema = z.object({
  inserted: z.number().int().nonnegative(),
});

export type CreateMeasurementBatchResponse = z.infer<
  typeof createMeasurementBatchResponseSchema
>;

export const measurementResponseSchema = z.object({
  id: z.string().uuid(),
  hiveId: z.string().uuid(),
  metric: z.string(),
  value: z.number(),
  unit: z.string().nullable(),
  recordedAt: z.string().datetime(),
  source: z.string().nullable(),
  createdAt: z.string().datetime(),
  boxId: z.string().uuid().nullable(),
  side: measurementSideSchema.nullable(),
  inspectionId: z.string().uuid().nullable(),
});

export type MeasurementResponse = z.infer<typeof measurementResponseSchema>;

export const measurementFilterSchema = z.object({
  metric: metricNameSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(5000).optional(),
});

export type MeasurementFilter = z.infer<typeof measurementFilterSchema>;

export const latestMeasurementEntrySchema = z.object({
  value: z.number(),
  unit: z.string().nullable(),
  recordedAt: z.string().datetime(),
  source: z.string().nullable(),
  boxId: z.string().uuid().nullable(),
  side: measurementSideSchema.nullable(),
});

export type LatestMeasurementEntry = z.infer<
  typeof latestMeasurementEntrySchema
>;

export const latestMeasurementsResponseSchema = z.record(
  z.string(),
  latestMeasurementEntrySchema,
);

export type LatestMeasurementsResponse = z.infer<
  typeof latestMeasurementsResponseSchema
>;

/**
 * A single manual weight reading captured during an inspection. The value is
 * stored canonically in kilograms; the UI converts to the user's preferred
 * unit for display/entry.
 *
 *   boxId = null -> measured at the base / whole hive lifted from the bottom
 *   side  = null -> whole/total weight (no specific edge)
 */
export const weightReadingSchema = z.object({
  id: z.string().uuid().optional(),
  value: z.number().finite().nonnegative(),
  unit: z.string().max(16).default('kg'),
  boxId: z.string().uuid().nullish(),
  side: measurementSideSchema.nullish(),
  recordedAt: z.string().datetime().optional(),
});

export type WeightReading = z.infer<typeof weightReadingSchema>;

export const weightReadingResponseSchema = z.object({
  id: z.string().uuid(),
  value: z.number(),
  unit: z.string().nullable(),
  boxId: z.string().uuid().nullable(),
  side: measurementSideSchema.nullable(),
  recordedAt: z.string().datetime(),
});

export type WeightReadingResponse = z.infer<typeof weightReadingResponseSchema>;
