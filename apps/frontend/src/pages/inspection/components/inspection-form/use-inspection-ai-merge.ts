import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { InspectionFormData } from './schema';
import {
  buildAiMergeState,
  mergeAcceptedAiAction,
  type AiMergeState,
} from '@/pages/inspection/lib/inspection-ai-merge';
import {
  aiDateHasTimeOfDay,
  isAiActionField,
} from '@/pages/inspection/lib/inspection-ai-draft';

type UseInspectionAiMergeParams = {
  form: UseFormReturn<InspectionFormData>;
  aiDraft?: Partial<InspectionFormData>;
  aiSuggestedFields?: string[];
};

export const useInspectionAiMerge = ({
  form,
  aiDraft,
  aiSuggestedFields = [],
}: UseInspectionAiMergeParams) => {
  const [aiMergeState, setAiMergeState] = useState<AiMergeState | null>(null);

  const aiSuggestedFieldSet = useMemo(
    () => new Set(aiSuggestedFields),
    [aiSuggestedFields],
  );

  const isAiSuggested = useCallback(
    (field: string) => aiSuggestedFieldSet.has(field),
    [aiSuggestedFieldSet],
  );

  useEffect(() => {
    if (!aiDraft || aiSuggestedFields.length === 0) {
      setAiMergeState(null);
      return;
    }

    const currentValues = form.getValues();
    const mergeState = buildAiMergeState(currentValues, aiDraft);

    const filteredSuggestions = Object.fromEntries(
      Object.entries(mergeState.suggestions).filter(([field]) =>
        aiSuggestedFieldSet.has(field),
      ),
    );

    if (Object.keys(filteredSuggestions).length === 0) {
      setAiMergeState(null);
      return;
    }

    setAiMergeState({
      suggestions: filteredSuggestions,
    });
  }, [aiDraft, aiSuggestedFields, aiSuggestedFieldSet, form]);

  const applySuggestionValue = useCallback(
    (field: string, aiValue: unknown) => {
      const setValueOptions = {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      } as const;

      // Accepted actions are merged into the actions array (replacing an
      // existing action of the same type) instead of written at their index.
      if (isAiActionField(field)) {
        form.setValue(
          'actions',
          mergeAcceptedAiAction(form.getValues('actions'), aiValue),
          setValueOptions,
        );
        return;
      }

      form.setValue(field as never, aiValue as never, setValueOptions);

      // A spoken time of day means the inspection isn't an all-day entry.
      if (field === 'date' && aiValue instanceof Date && aiDateHasTimeOfDay(aiValue)) {
        form.setValue('isAllDay', false, setValueOptions);
      }
    },
    [form],
  );

  const acceptAiSuggestion = useCallback(
    (field: string) => {
      const suggestion = aiMergeState?.suggestions[field];
      if (!suggestion) return;

      applySuggestionValue(field, suggestion.aiValue);

      setAiMergeState(prev => {
        if (!prev) return prev;

        return {
          suggestions: {
            ...prev.suggestions,
            [field]: {
              ...prev.suggestions[field],
              status: 'accepted',
            },
          },
        };
      });
    },
    [aiMergeState, applySuggestionValue],
  );

  const dismissAiSuggestion = useCallback((field: string) => {
    setAiMergeState(prev => {
      if (!prev) return prev;

      return {
        suggestions: {
          ...prev.suggestions,
          [field]: {
            ...prev.suggestions[field],
            status: 'dismissed',
          },
        },
      };
    });
  }, []);

  const acceptAllSafeAiSuggestions = useCallback(() => {
    if (!aiMergeState) return;

    Object.values(aiMergeState.suggestions).forEach(suggestion => {
      if (suggestion.status !== 'pending') return;
      if (suggestion.hasConflict) return;

      applySuggestionValue(suggestion.field, suggestion.aiValue);
    });

    setAiMergeState(prev => {
      if (!prev) return prev;

      return {
        suggestions: Object.fromEntries(
          Object.entries(prev.suggestions).map(([field, suggestion]) => {
            if (suggestion.status !== 'pending' || suggestion.hasConflict) {
              return [field, suggestion];
            }

            return [field, { ...suggestion, status: 'accepted' }];
          }),
        ),
      };
    });
  }, [aiMergeState, applySuggestionValue]);

  const reviewConflicts = useCallback(() => {
    const firstConflict = aiMergeState
      ? Object.values(aiMergeState.suggestions).find(
          suggestion =>
            suggestion.status === 'pending' && suggestion.hasConflict,
        )
      : null;

    if (!firstConflict) return;

    const element = document.querySelector(
      `[data-ai-field="${firstConflict.field}"]`,
    );

    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [aiMergeState]);

  const dismissAllAiSuggestions = useCallback(() => {
    if (!aiMergeState) return;

    setAiMergeState({
      suggestions: Object.fromEntries(
        Object.entries(aiMergeState.suggestions).map(([field, suggestion]) => [
          field,
          { ...suggestion, status: 'dismissed' },
        ]),
      ),
    });
  }, [aiMergeState]);

  const pendingSuggestionCount = aiMergeState
    ? Object.values(aiMergeState.suggestions).filter(
        suggestion => suggestion.status === 'pending',
      ).length
    : 0;

  const conflictSuggestionCount = aiMergeState
    ? Object.values(aiMergeState.suggestions).filter(
        suggestion => suggestion.status === 'pending' && suggestion.hasConflict,
      ).length
    : 0;

  return {
    aiMergeState,
    isAiSuggested,
    acceptAiSuggestion,
    dismissAiSuggestion,
    acceptAllSafeAiSuggestions,
    reviewConflicts,
    dismissAllAiSuggestions,
    pendingSuggestionCount,
    conflictSuggestionCount,
  };
};