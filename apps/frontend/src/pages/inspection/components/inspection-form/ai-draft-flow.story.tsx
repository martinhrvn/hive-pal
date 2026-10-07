import { useMemo } from 'react';
import * as ReactHookForm from 'react-hook-form';
import { ActionsSection } from './actions';
import { WeatherSection } from './weather';
import { useInspectionAiMerge } from './use-inspection-ai-merge';
import { parseAiInspectionDraft } from '@/pages/inspection/lib/inspection-ai-draft';
import type { InspectionFormData } from './schema';

/**
 * Drives the full AI-draft chain the way the edit page does:
 * raw canonical draft (what apps/ai-app emits) → parseAiInspectionDraft →
 * useInspectionAiMerge → section components with per-field suggestions.
 */

// Shaped exactly like the AI service's normalized output.
const RAW_CANONICAL_DRAFT = {
  date: '2026-07-12T15:30:00',
  temperature: 24,
  weatherConditions: 'sunny',
  notes: 'Colony is strong, queen seen on frame 4.',
  observations: {
    strength: 8,
    uncappedBrood: null,
    cappedBrood: 6,
    honeyStores: null,
    pollenStores: null,
    totalFrames: null,
    eggsFrames: null,
    uncappedBroodFrames: null,
    cappedBroodFrames: 4,
    droneBroodFrames: null,
    pollenFrames: null,
    nectarFrames: null,
    honeyFrames: null,
    emptyFrames: null,
    queenCells: 0,
    swarmCells: false,
    supersedureCells: null,
    queenSeen: true,
    broodPattern: 'solid',
    additionalObservations: ['calm'],
    reminderObservations: [],
  },
  actions: [
    {
      type: 'TREATMENT',
      notes: 'evening application',
      details: {
        type: 'TREATMENT',
        product: 'OXALIC_ACID',
        quantity: 30,
        unit: 'ml',
        duration: null,
      },
    },
    {
      type: 'FEEDING',
      notes: null,
      details: {
        type: 'FEEDING',
        feedType: 'Syrup',
        amount: 2,
        unit: 'l',
        concentration: '1:1',
      },
    },
  ],
};

// The pre-redesign draft format (flat form-shaped actions, free-text
// weather) — must degrade gracefully instead of crashing the page.
const LEGACY_FORM_SHAPED_DRAFT = {
  temperature: 18,
  weatherConditions: 'warm and a bit windy',
  notes: 'Old draft format',
  observations: { strength: 5 },
  actions: [
    { type: 'FEEDING', feedType: 'Syrup', quantity: 2, unit: 'l', notes: '' },
  ],
};

const AiDraftFlowHarness = ({
  rawDraft,
  defaultActions = [],
}: {
  rawDraft: unknown;
  defaultActions?: InspectionFormData['actions'];
}) => {
  // Parse once — like the edit page, which memoizes the parsed draft. An
  // unstable draft identity would rebuild the merge state on every render
  // and reset accepted/dismissed suggestions.
  const parsed = useMemo(() => parseAiInspectionDraft(rawDraft), [rawDraft]);

  const form = ReactHookForm.useForm<InspectionFormData>({
    defaultValues: {
      date: new Date('2026-07-14T00:00:00'),
      isAllDay: true,
      actions: defaultActions,
    },
  });

  const {
    aiMergeState,
    isAiSuggested,
    acceptAiSuggestion,
    dismissAiSuggestion,
    pendingSuggestionCount,
    conflictSuggestionCount,
  } = useInspectionAiMerge({
    form,
    aiDraft: parsed?.formDraft,
    aiSuggestedFields: parsed?.suggestedFields ?? [],
  });

  const values = form.watch();

  return (
    <ReactHookForm.FormProvider {...form}>
      <form>
        <WeatherSection
          isAiSuggested={isAiSuggested}
          aiMergeState={aiMergeState}
          onAcceptSuggestion={acceptAiSuggestion}
          onDismissSuggestion={dismissAiSuggestion}
        />
        <ActionsSection
          isAiSuggested={isAiSuggested}
          aiMergeState={aiMergeState}
          onAcceptSuggestion={acceptAiSuggestion}
          onDismissSuggestion={dismissAiSuggestion}
          disableBoxConfig
        />
        <div data-test="pending-count">pending:{pendingSuggestionCount}</div>
        <div data-test="conflict-count">conflicts:{conflictSuggestionCount}</div>
        <pre data-test="form-values">
          {JSON.stringify(
            {
              temperature: values.temperature ?? null,
              weatherConditions: values.weatherConditions ?? null,
              actions: values.actions ?? [],
            },
            null,
            2,
          )}
        </pre>
      </form>
    </ReactHookForm.FormProvider>
  );
};

export const AiDraftFlow = () => (
  <AiDraftFlowHarness rawDraft={RAW_CANONICAL_DRAFT} />
);

export const AiDraftFlowWithExistingFeeding = () => (
  <AiDraftFlowHarness
    rawDraft={RAW_CANONICAL_DRAFT}
    defaultActions={[
      {
        type: 'FEEDING',
        feedType: 'Honey',
        quantity: 1,
        unit: 'kg',
      } as NonNullable<InspectionFormData['actions']>[number],
    ]}
  />
);

export const AiDraftFlowLegacyDraft = () => (
  <AiDraftFlowHarness rawDraft={LEGACY_FORM_SHAPED_DRAFT} />
);
