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
