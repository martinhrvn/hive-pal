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

export const batchInspectionStatusSchema = z.nativeEnum(BatchInspectionStatus);
export const batchHiveStatusSchema = z.nativeEnum(BatchHiveStatus);
