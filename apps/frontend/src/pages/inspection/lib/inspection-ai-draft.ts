import {
  aiInspectionDraftSchema,
  ActionType,
  type AiDraftAction,
  type AiInspectionDraft,
} from 'shared-schemas';
import type {
  ActionData,
  InspectionFormData,
} from '@/pages/inspection/components/inspection-form/schema';

export type ParsedAiInspectionDraft = {
  formDraft: Partial<InspectionFormData>;
  suggestedFields: string[];
};

/** Matches per-action suggestion fields, e.g. "actions.0". */
export const AI_ACTION_FIELD_PATTERN = /^actions\.\d+$/;

export const isAiActionField = (field: string): boolean =>
  AI_ACTION_FIELD_PATTERN.test(field);

/** True when the suggested date carries a spoken time of day (not midnight). */
export const aiDateHasTimeOfDay = (date: Date): boolean =>
  date.getHours() !== 0 ||
  date.getMinutes() !== 0 ||
  date.getSeconds() !== 0;

const joinNotes = (...parts: Array<string | null | undefined>): string =>
  parts.filter(part => part && part.trim() !== '').join(' — ');

/**
 * Map one canonical draft action ({type, notes, details}) to the inspection
 * form's flat action shape. Unknown values are omitted (not filled with empty
 * strings) so the form's validation flags them for completion when accepted.
 */
const mapDraftActionToForm = (action: AiDraftAction): ActionData | null => {
  const notes = action.notes ?? undefined;

  switch (action.details.type) {
    case 'FEEDING':
      return {
        type: ActionType.FEEDING,
        feedType: action.details.feedType ?? undefined,
        quantity: action.details.amount ?? undefined,
        unit: action.details.unit ?? undefined,
        concentration: action.details.concentration ?? undefined,
        notes,
      } as ActionData;
    case 'TREATMENT':
      return {
        type: ActionType.TREATMENT,
        treatmentType: action.details.product ?? undefined,
        amount: action.details.quantity ?? undefined,
        unit: action.details.unit ?? undefined,
        // The form has no duration field — keep it in the notes instead of
        // silently dropping it.
        notes: joinNotes(notes, action.details.duration) || undefined,
      } as ActionData;
    case 'FRAME':
      return {
        type: ActionType.FRAME,
        frames: action.details.quantity ?? undefined,
        notes,
      } as ActionData;
    case 'MAINTENANCE':
      return {
        type: ActionType.MAINTENANCE,
        component: action.details.component ?? undefined,
        status: action.details.status ?? undefined,
        notes,
      } as ActionData;
    case 'NOTE': {
      const content = joinNotes(action.details.content, notes);
      if (!content) return null;
      return { type: ActionType.NOTE, notes: content } as ActionData;
    }
    case 'OTHER': {
      if (!notes) return null;
      return { type: ActionType.OTHER, notes } as ActionData;
    }
    default:
      return null;
  }
};

const isMeaningfulValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;

  // Keep false and 0 as valid suggestions.
  return true;
};

const buildFormDraft = (
  draft: AiInspectionDraft,
): Partial<InspectionFormData> => {
  const formDraft: Partial<InspectionFormData> = {};

  if (draft.date) {
    const date = new Date(draft.date);
    if (!Number.isNaN(date.getTime())) {
      formDraft.date = date;
    }
  }

  if (draft.temperature != null) formDraft.temperature = draft.temperature;
  if (draft.weatherConditions) {
    formDraft.weatherConditions = draft.weatherConditions;
  }
  if (draft.notes) formDraft.notes = draft.notes;

  if (draft.observations) {
    const observations: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(draft.observations)) {
      if (isMeaningfulValue(value)) {
        observations[key] = value;
      }
    }
    if (Object.keys(observations).length > 0) {
      formDraft.observations =
        observations as InspectionFormData['observations'];
    }
  }

  const actions = draft.actions
    .map(mapDraftActionToForm)
    .filter((action): action is ActionData => action !== null);
  if (actions.length > 0) {
    formDraft.actions = actions;
  }

  return formDraft;
};

const collectSuggestedFields = (
  formDraft: Partial<InspectionFormData>,
): string[] => {
  const fields: string[] = [];

  for (const [key, value] of Object.entries(formDraft)) {
    if (key === 'actions') {
      (value as ActionData[]).forEach((_, index) => {
        fields.push(`actions.${index}`);
      });
      continue;
    }

    if (key === 'observations') {
      for (const [obsKey, obsValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (isMeaningfulValue(obsValue)) {
          fields.push(`observations.${obsKey}`);
        }
      }
      continue;
    }

    if (isMeaningfulValue(value)) {
      fields.push(key);
    }
  }

  return fields;
};

/**
 * Parse a raw AI inspection draft (canonical createInspectionSchema shape,
 * validated by the lenient aiInspectionDraftSchema) into form-shaped values
 * plus the list of suggested field paths. Returns null when the payload is
 * not draft-shaped at all.
 */
export const parseAiInspectionDraft = (
  raw: unknown,
): ParsedAiInspectionDraft | null => {
  const parsed = aiInspectionDraftSchema.safeParse(raw);
  if (!parsed.success) return null;

  const formDraft = buildFormDraft(parsed.data);
  const suggestedFields = collectSuggestedFields(formDraft);

  if (suggestedFields.length === 0) return null;

  return { formDraft, suggestedFields };
};
