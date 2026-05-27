import { z } from 'zod';

export const completeTranscriptionSchema = z.object({
  text: z.string().min(0),
  duration: z.number().positive().optional(),
});
export type CompleteTranscriptionDto = z.infer<
  typeof completeTranscriptionSchema
>;

export const failJobSchema = z.object({
  error: z.string().min(1).max(2000),
});
export type FailJobDto = z.infer<typeof failJobSchema>;

export const completeAnalysisSchema = z.object({
  inspectionDraft: z.record(z.string(), z.unknown()),
});
export type CompleteAnalysisDto = z.infer<typeof completeAnalysisSchema>;
