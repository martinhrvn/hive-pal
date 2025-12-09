import { z } from 'zod';
import { transcriptionStatusSchema } from './transcription-status';

// Audio recording response
export const audioResponseSchema = z.object({
  id: z.string().uuid(),
  inspectionId: z.string().uuid(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  duration: z.number().nullable(),
  transcriptionStatus: transcriptionStatusSchema,
  transcription: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type AudioResponse = z.infer<typeof audioResponseSchema>;

// Download URL response
export const downloadUrlResponseSchema = z.object({
  downloadUrl: z.string().url(),
  expiresIn: z.number().positive(),
});

export type DownloadUrlResponse = z.infer<typeof downloadUrlResponseSchema>;
