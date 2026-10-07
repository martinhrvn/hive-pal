import type { InspectionFormData } from '@/pages/inspection/components/inspection-form/schema';

export type AiFieldSuggestionStatus = 'pending' | 'accepted' | 'dismissed';

export type AiFieldSuggestion<T = unknown> = {
  field: string;
  aiValue: T;
  currentValue: T | undefined;
  hasConflict: boolean;
  status: AiFieldSuggestionStatus;
};

export type AiMergeState = {
  suggestions: Record<string, AiFieldSuggestion>;
};

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

function flattenObject(
  value: Record<string, unknown>,
  prefix = '',
): Array<[string, unknown]> {
  const result: Array<[string, unknown]> = [];

  for (const [key, nestedValue] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(nestedValue)) {
      result.push(...flattenObject(nestedValue, path));
      continue;
    }

    result.push([path, nestedValue]);
  }

  return result;
}

function getValueAtPath(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;

  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export function buildAiMergeState(
  currentValues: Partial<InspectionFormData>,
  aiValues: Partial<InspectionFormData>,
): AiMergeState {
  const suggestions: Record<string, AiFieldSuggestion> = {};

  const { actions: aiActions, ...restAiValues } = aiValues;

  const flattened = flattenObject(restAiValues as Record<string, unknown>);

  for (const [field, aiValue] of flattened) {
    if (aiValue === undefined) continue;

    const currentValue = getValueAtPath(currentValues, field);
    const hasConflict = !isEmptyValue(currentValue);

    suggestions[field] = {
      field,
      aiValue,
      currentValue,
      hasConflict,
      status: 'pending',
    };
  }

  // Actions become one suggestion each ("actions.<i>") so the user can accept
  // or dismiss them individually. The form keeps at most one action per type,
  // so a conflict means an action of the same type already exists.
  const currentActions = Array.isArray(currentValues.actions)
    ? currentValues.actions
    : [];

  (aiActions ?? []).forEach((aiAction, index) => {
    if (!aiAction || typeof aiAction !== 'object') return;

    const field = `actions.${index}`;
    const currentValue = currentActions.find(
      action => action.type === aiAction.type,
    );

    suggestions[field] = {
      field,
      aiValue: aiAction,
      currentValue,
      hasConflict: currentValue !== undefined,
      status: 'pending',
    };
  });

  return { suggestions };
}

/**
 * Merge an accepted AI action suggestion into the form's actions array.
 * The form keeps at most one action per type, so an existing action of the
 * same type is replaced.
 */
export function mergeAcceptedAiAction(
  currentActions: InspectionFormData['actions'],
  aiAction: unknown,
): InspectionFormData['actions'] {
  if (!aiAction || typeof aiAction !== 'object') {
    return currentActions ?? [];
  }

  const typedAction = aiAction as NonNullable<
    InspectionFormData['actions']
  >[number];

  return [
    ...(currentActions ?? []).filter(
      action => action.type !== typedAction.type,
    ),
    typedAction,
  ];
}

export function shouldUseAiPrefill(
  currentValue: unknown,
  isDirty: boolean,
  suggestion?: { aiValue: unknown; status: 'pending' | 'accepted' | 'dismissed' } | null,
): boolean {
  if (!suggestion) return false;
  if (suggestion.status !== 'pending') return false;
  if (isDirty) return false;

  if (currentValue === undefined || currentValue === null) return true;
  if (typeof currentValue === 'string' && currentValue.trim() === '') return true;
  if (Array.isArray(currentValue) && currentValue.length === 0) return true;

  return false;
}