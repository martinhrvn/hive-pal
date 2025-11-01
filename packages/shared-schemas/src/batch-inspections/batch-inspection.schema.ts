import { z } from 'zod';
import { batchInspectionStatusSchema, batchHiveStatusSchema } from './status';

// Schema for creating a batch inspection
export const createBatchInspectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  apiaryId: z.string().uuid(),
  hiveIds: z.array(z.string().uuid()).min(1, 'At least one hive is required'),
});

// Schema for updating batch inspection (name only when in DRAFT)
export const updateBatchInspectionSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
});

// Schema for reordering hives in a batch
export const reorderBatchHivesSchema = z.object({
  hiveOrders: z.array(
    z.object({
      hiveId: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ),
});

// Schema for batch inspection hive entry
export const batchInspectionHiveSchema = z.object({
  id: z.string().uuid(),
  hiveId: z.string().uuid(),
  order: z.number().int(),
  status: batchHiveStatusSchema,
  inspectionId: z.string().uuid().nullable(),
  completedAt: z.string().datetime().nullable(),
  skippedCount: z.number().int(),
});

// Schema for batch inspection with hive details
export const batchInspectionHiveWithDetailsSchema =
  batchInspectionHiveSchema.extend({
    hive: z.object({
      id: z.string().uuid(),
      name: z.string(),
      status: z.string(),
      apiaryId: z.string().uuid().nullable(),
    }),
  });

// Progress information for batch inspection
export const batchInspectionProgressSchema = z.object({
  total: z.number().int(),
  completed: z.number().int(),
  pending: z.number().int(),
  cancelled: z.number().int(),
  elapsedMinutes: z.number().nullable(),
  averageMinutesPerHive: z.number().nullable(),
  estimatedRemainingMinutes: z.number().nullable(),
});

// Schema for batch inspection response
export const batchInspectionResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  apiaryId: z.string().uuid(),
  status: batchInspectionStatusSchema,
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  hives: z.array(batchInspectionHiveWithDetailsSchema),
  progress: batchInspectionProgressSchema,
});

// Schema for current hive to inspect
export const currentHiveToInspectSchema = z.object({
  batchInspectionHive: batchInspectionHiveWithDetailsSchema,
  position: z.number().int(), // 1-based position (e.g., "Hive 3 of 10")
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});

// Schema for creating inspection within batch
export const createBatchInspectionEntrySchema = z.object({
  inspectionData: z.any(), // Will use CreateInspection from inspections schema
});

// Type exports
export type CreateBatchInspection = z.infer<
  typeof createBatchInspectionSchema
>;
export type UpdateBatchInspection = z.infer<
  typeof updateBatchInspectionSchema
>;
export type ReorderBatchHives = z.infer<typeof reorderBatchHivesSchema>;
export type BatchInspectionHive = z.infer<typeof batchInspectionHiveSchema>;
export type BatchInspectionHiveWithDetails = z.infer<
  typeof batchInspectionHiveWithDetailsSchema
>;
export type BatchInspectionProgress = z.infer<
  typeof batchInspectionProgressSchema
>;
export type BatchInspectionResponse = z.infer<
  typeof batchInspectionResponseSchema
>;
export type CurrentHiveToInspect = z.infer<typeof currentHiveToInspectSchema>;
export type CreateBatchInspectionEntry = z.infer<
  typeof createBatchInspectionEntrySchema
>;
