import { z } from 'zod';
import {
  additionalObservationSchema,
  reminderObservationSchema,
} from '../inspections/observations.schema';

// Tag values reuse existing observation enums
export const quickCheckTagSchema = z.union([
  additionalObservationSchema,
  reminderObservationSchema,
]);

export type QuickCheckTag = z.infer<typeof quickCheckTagSchema>;

// Create quick check
export const createQuickCheckSchema = z.object({
  hiveId: z.string().uuid().optional(),
  apiaryId: z.string().uuid(),
  date: z.string().datetime().optional(),
  note: z.string().max(2000).optional(),
  tags: z.array(quickCheckTagSchema).optional(),
});

export type CreateQuickCheck = z.infer<typeof createQuickCheckSchema>;

// Quick check photo response
export const quickCheckPhotoResponseSchema = z.object({
  id: z.string().uuid(),
  quickCheckId: z.string().uuid(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  createdAt: z.string().datetime(),
});

export type QuickCheckPhotoResponse = z.infer<
  typeof quickCheckPhotoResponseSchema
>;

// Quick check response
export const quickCheckResponseSchema = z.object({
  id: z.string().uuid(),
  hiveId: z.string().uuid().nullable(),
  apiaryId: z.string().uuid(),
  date: z.string().datetime(),
  note: z.string().nullable(),
  tags: z.array(z.string()),
  photos: z.array(quickCheckPhotoResponseSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type QuickCheckResponse = z.infer<typeof quickCheckResponseSchema>;

// Filter quick checks
export const quickCheckFilterSchema = z.object({
  hiveId: z.string().uuid().optional(),
  apiaryId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type QuickCheckFilter = z.infer<typeof quickCheckFilterSchema>;

// Download URL response (reused pattern)
export const photoDownloadUrlResponseSchema = z.object({
  downloadUrl: z.string().url(),
  expiresIn: z.number().positive(),
});

export type PhotoDownloadUrlResponse = z.infer<
  typeof photoDownloadUrlResponseSchema
>;
