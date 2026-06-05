import type {
  CreateInspection,
  CreateInspectionResponse,
  CreateQueen,
  CreateStandaloneAction,
  ActionResponse,
  QueenResponse,
} from 'shared-schemas';
import { transformActionsForApi } from '@/api/hooks/useInspections';
import type {
  ActionData,
  FeedingActionData,
  FramesActionData,
  NoteActionData,
  TreatmentActionData,
} from '@/pages/inspection/components/inspection-form/schema';
import type { StagedItem } from './types';

interface Mutations {
  createAction: (data: CreateStandaloneAction) => Promise<ActionResponse>;
  createInspection: (data: CreateInspection) => Promise<CreateInspectionResponse>;
  createQueen: (data: CreateQueen) => Promise<QueenResponse>;
}

export interface SubmitResult {
  succeededIds: string[];
  failedIds: string[];
  counts: { action: number; inspection: number; queen: number };
}

const buildActionPayload = (
  item: Extract<StagedItem, { kind: 'action' }>,
): CreateStandaloneAction => {
  const action = item.action;
  let details: CreateStandaloneAction['details'];

  switch (action.type) {
    case 'FEEDING': {
      const a = action as FeedingActionData;
      details = {
        type: 'FEEDING',
        feedType: a.feedType,
        amount: a.quantity,
        unit: a.unit,
        concentration: a.concentration,
      } as CreateStandaloneAction['details'];
      break;
    }
    case 'TREATMENT': {
      const a = action as TreatmentActionData;
      details = {
        type: 'TREATMENT',
        product: a.treatmentType,
        quantity: a.amount,
        unit: a.unit,
      } as CreateStandaloneAction['details'];
      break;
    }
    case 'FRAME': {
      const a = action as FramesActionData;
      details = {
        type: 'FRAME',
        quantity: a.frames,
      } as CreateStandaloneAction['details'];
      break;
    }
    case 'NOTE': {
      const a = action as NoteActionData;
      details = {
        type: 'NOTE',
        content: a.notes,
      } as CreateStandaloneAction['details'];
      break;
    }
    case 'MAINTENANCE':
      details = {
        type: 'MAINTENANCE',
        component: action.component,
        status: action.status,
      } as CreateStandaloneAction['details'];
      break;
    default:
      details = { type: 'OTHER' } as CreateStandaloneAction['details'];
  }

  return {
    hiveId: item.hiveId,
    type: action.type as CreateStandaloneAction['type'],
    details,
    notes: (action as { notes?: string }).notes,
    date: item.date.toISOString(),
  };
};

const buildInspectionPayload = (
  item: Extract<StagedItem, { kind: 'inspection' }>,
): CreateInspection => {
  const p = item.inspection;
  return {
    hiveId: item.hiveId,
    date: item.date.toISOString(),
    isAllDay: true,
    temperature: p.temperature ?? null,
    weatherConditions: p.weatherConditions ?? null,
    notes: p.notes ?? null,
    observations: p.observations,
    actions: transformActionsForApi(p.actions as ActionData[] | undefined),
  };
};

const buildQueenPayload = (
  item: Extract<StagedItem, { kind: 'queen' }>,
): CreateQueen => {
  const q = item.queen;
  return {
    hiveId: item.hiveId,
    year: q.year,
    marking: q.marking ?? null,
    color: q.color ?? null,
    source: q.source ?? null,
    status: q.status,
    installedAt: q.installedAt.toISOString(),
    replacedAt: q.replacedAt ? q.replacedAt.toISOString() : null,
  };
};

export const submitStagedItems = async (
  items: StagedItem[],
  mutations: Mutations,
): Promise<SubmitResult> => {
  const result: SubmitResult = {
    succeededIds: [],
    failedIds: [],
    counts: { action: 0, inspection: 0, queen: 0 },
  };

  for (const item of items) {
    try {
      if (item.kind === 'action') {
        await mutations.createAction(buildActionPayload(item));
      } else if (item.kind === 'inspection') {
        await mutations.createInspection(buildInspectionPayload(item));
      } else {
        await mutations.createQueen(buildQueenPayload(item));
      }
      result.succeededIds.push(item.id);
      result.counts[item.kind]++;
    } catch {
      result.failedIds.push(item.id);
    }
  }

  return result;
};
