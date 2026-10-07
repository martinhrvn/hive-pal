import { sanitizeAiInspectionDraft } from './ai-inspection-draft';

describe('sanitizeAiInspectionDraft', () => {
  it('returns null for non-object payloads', () => {
    expect(sanitizeAiInspectionDraft(null)).toBeNull();
    expect(sanitizeAiInspectionDraft('not a draft')).toBeNull();
    expect(sanitizeAiInspectionDraft(42)).toBeNull();
  });

  it('keeps a valid canonical draft intact', () => {
    const draft = {
      date: '2026-07-12T10:30:00Z',
      temperature: 24,
      weatherConditions: 'sunny',
      notes: 'Strong colony',
      observations: {
        strength: 8,
        queenSeen: true,
        queenCells: 0,
        swarmCells: false,
        cappedBroodFrames: 4,
        broodPattern: 'solid',
        additionalObservations: ['calm', 'healthy'],
        reminderObservations: ['needs_super'],
      },
      actions: [
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

    const result = sanitizeAiInspectionDraft(draft);

    expect(result).not.toBeNull();
    expect(result?.date).toBe('2026-07-12T10:30:00Z');
    expect(result?.weatherConditions).toBe('sunny');
    expect(result?.observations?.strength).toBe(8);
    expect(result?.observations?.queenCells).toBe(0);
    expect(result?.observations?.swarmCells).toBe(false);
    expect(result?.observations?.additionalObservations).toEqual([
      'calm',
      'healthy',
    ]);
    expect(result?.actions).toHaveLength(1);
    expect(result?.actions?.[0].details).toMatchObject({
      type: 'FEEDING',
      feedType: 'Syrup',
      amount: 2,
    });
  });

  it('degrades invalid values to null instead of rejecting the draft', () => {
    const result = sanitizeAiInspectionDraft({
      date: 'yesterday afternoon',
      temperature: 'warm',
      weatherConditions: 'a bit gloomy',
      notes: 'ok',
      observations: {
        strength: -3,
        cappedBrood: 25,
        broodPattern: 'zigzag',
        additionalObservations: ['calm', 'levitating'],
      },
      actions: [],
    });

    expect(result).not.toBeNull();
    expect(result?.date).toBeNull();
    expect(result?.temperature).toBeNull();
    expect(result?.weatherConditions).toBeNull();
    expect(result?.notes).toBe('ok');
    expect(result?.observations?.strength).toBeNull();
    expect(result?.observations?.cappedBrood).toBeNull();
    expect(result?.observations?.broodPattern).toBeNull();
    expect(result?.observations?.additionalObservations).toEqual(['calm']);
  });

  it('drops invalid or unsupported actions but keeps valid ones', () => {
    const result = sanitizeAiInspectionDraft({
      actions: [
        {
          type: 'TREATMENT',
          notes: 'evening',
          details: {
            type: 'TREATMENT',
            product: 'OXALIC_ACID',
            quantity: 30,
            unit: 'ml',
          },
        },
        // details.type mismatch → dropped
        { type: 'FEEDING', details: { type: 'NOTE', content: 'x' } },
        // unsupported action type → dropped
        { type: 'BOX_CONFIGURATION', details: { type: 'BOX_CONFIGURATION' } },
        'garbage',
      ],
    });

    expect(result).not.toBeNull();
    expect(result?.actions).toHaveLength(1);
    expect(result?.actions?.[0].type).toBe('TREATMENT');
  });

  it('accepts drafts with missing sections', () => {
    const result = sanitizeAiInspectionDraft({});

    expect(result).not.toBeNull();
    expect(result?.actions).toEqual([]);
    expect(result?.observations ?? null).toBeNull();
  });
});
