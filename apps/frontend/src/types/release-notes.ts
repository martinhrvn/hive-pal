import { z } from 'zod';

export const releaseNoteSchema = z.object({
  version: z.string(),
  releaseDate: z.string(),
  content: z.string(),
});

export type ReleaseNote = z.infer<typeof releaseNoteSchema>;

export interface ParsedReleaseNote extends ReleaseNote {
  title: string;
  htmlContent: string;
}

export interface DismissedRelease {
  version: string;
  dismissedAt: string;
}