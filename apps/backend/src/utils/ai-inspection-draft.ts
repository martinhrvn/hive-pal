import { aiInspectionDraftSchema, AiInspectionDraft } from 'shared-schemas';

/**
 * Validate an AI-generated inspection draft before it is persisted.
 *
 * aiInspectionDraftSchema is lenient (invalid values degrade to null and
 * invalid actions are dropped), so this returns null only when the payload
 * is not a draft-shaped object at all.
 */
export function sanitizeAiInspectionDraft(
  raw: unknown,
): AiInspectionDraft | null {
  const parsed = aiInspectionDraftSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
