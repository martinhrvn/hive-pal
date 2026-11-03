import { z } from 'zod';

export enum BatchInspectionStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum BatchHiveStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const batchInspectionStatusSchema = z.enum(BatchInspectionStatus);
export const batchHiveStatusSchema = z.enum(BatchHiveStatus);
