import { AlertSeverity } from 'shared-schemas';

export interface AlertIssue {
  type: string;
  message: string;
  severity: AlertSeverity;
  metadata?: Record<string, any>;
}

export interface HiveContext {
  hiveId: string;
  name: string;
  settings: any;
  lastInspectionDate?: Date;
  status: string;
  apiaryId?: string;
  // The hive's current (active or virgin) queen, if any
  currentQueen?: {
    id: string;
    name: string | null;
    marking: string | null;
    year: number | null;
    status: string;
    statusChangedAt: Date;
    cellCappedAt: Date | null;
    emergedAt: Date | null;
  } | null;
}

export interface CheckerContext {
  userId: string;
  apiaryId: string;
  currentTime: Date;
}

export abstract class HiveChecker {
  abstract getCheckerType(): string;
  abstract checkHive(hive: HiveContext, context: CheckerContext): AlertIssue[];

  protected abstract getDisplayName(): string;
}
