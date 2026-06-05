import type {
  ActionData,
  ObservationFormData,
} from '@/pages/inspection/components/inspection-form/schema';

export type BulkTab = 'action' | 'inspection' | 'queen';

export interface BulkInspectionPayload {
  observations?: ObservationFormData;
  temperature?: number | null;
  weatherConditions?: string | null;
  notes?: string | null;
  actions?: ActionData[];
}

export interface BulkQueenPayload {
  year: number;
  marking?: string | null;
  color?: string | null;
  source?: string | null;
  status: 'ACTIVE' | 'REPLACED' | 'DEAD' | 'UNKNOWN';
  installedAt: Date;
  replacedAt?: Date | null;
}

interface StagedItemBase {
  id: string;
  hiveId: string;
  hiveName: string;
  date: Date;
}

export type StagedItem =
  | (StagedItemBase & { kind: 'action'; action: ActionData })
  | (StagedItemBase & { kind: 'inspection'; inspection: BulkInspectionPayload })
  | (StagedItemBase & { kind: 'queen'; queen: BulkQueenPayload });
