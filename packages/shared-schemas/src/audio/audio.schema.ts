import { z } from 'zod';
import { transcriptionStatusSchema } from './transcription-status';

// Audio recording response
export const audioResponseSchema = z.object({
  id: z.uuid(),
  inspectionId: z.uuid(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  duration: z.number().nullable(),
  transcriptionStatus: transcriptionStatusSchema,
  analysisStatus: transcriptionStatusSchema,
  transcription: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export type AudioResponse = z.infer<typeof audioResponseSchema>;

// Audio listing for the apiary-wide Files view (joined with inspection + hive)
export const apiaryAudioResponseSchema = audioResponseSchema.extend({
  inspectionDate: z.iso.datetime(),
  hiveId: z.uuid(),
  hiveName: z.string(),
});

export type ApiaryAudioResponse = z.infer<typeof apiaryAudioResponseSchema>;

export const startPendingAnalysisResponseSchema = z.object({
  started: z.int().nonnegative(),
});

export type StartPendingAnalysisResponse = z.infer<
  typeof startPendingAnalysisResponseSchema
>;

// Download URL response
export const downloadUrlResponseSchema = z.object({
  downloadUrl: z.url(),
  expiresIn: z.number().positive(),
});

export type DownloadUrlResponse = z.infer<typeof downloadUrlResponseSchema>;

// Update transcription + re-queue analysis
export const updateTranscriptionSchema = z.object({
  transcription: z.string().trim().min(1).max(10000),
});

export type UpdateTranscriptionRequest = z.infer<
  typeof updateTranscriptionSchema
>;
