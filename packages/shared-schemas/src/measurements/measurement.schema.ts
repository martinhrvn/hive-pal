import { z } from 'zod';

export const metricNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9_]+$/, 'metric must be lowercase snake_case');

export const measurementInputSchema = z.object({
  metric: metricNameSchema,
  value: z.number().finite(),
  unit: z.string().max(16).optional(),
  recordedAt: z.string().datetime().optional(),
  source: z.string().max(128).optional(),
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
