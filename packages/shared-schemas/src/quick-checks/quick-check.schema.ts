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
  hiveId: z.uuid().optional(),
  apiaryId: z.uuid(),
  date: z.iso.datetime().optional(),
  note: z.string().max(2000).optional(),
  tags: z.array(quickCheckTagSchema).optional(),
});

export type CreateQuickCheck = z.infer<typeof createQuickCheckSchema>;

// Quick check photo response
export const quickCheckPhotoResponseSchema = z.object({
  id: z.uuid(),
  quickCheckId: z.uuid(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  createdAt: z.iso.datetime(),
});

export type QuickCheckPhotoResponse = z.infer<
  typeof quickCheckPhotoResponseSchema
>;

// Quick check response
export const quickCheckResponseSchema = z.object({
  id: z.uuid(),
  hiveId: z.uuid().nullable(),
  apiaryId: z.uuid(),
  date: z.iso.datetime(),
  note: z.string().nullable(),
  tags: z.array(z.string()),
  photos: z.array(quickCheckPhotoResponseSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  createdByUserName: z.string().nullish(),
});

export type QuickCheckResponse = z.infer<typeof quickCheckResponseSchema>;

// Filter quick checks
export const quickCheckFilterSchema = z.object({
  hiveId: z.uuid().optional(),
  apiaryId: z.uuid().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
});

export type QuickCheckFilter = z.infer<typeof quickCheckFilterSchema>;

// Download URL response (reused pattern)
export const photoDownloadUrlResponseSchema = z.object({
  downloadUrl: z.url(),
  expiresIn: z.number().positive(),
});

export type PhotoDownloadUrlResponse = z.infer<
  typeof photoDownloadUrlResponseSchema
>;
