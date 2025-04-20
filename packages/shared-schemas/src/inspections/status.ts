import { z } from 'zod';

export enum InspectionStatus {
  SCHEDULED = 'SCHEDULED',
  OVERDUE = 'OVERDUE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}


export const inspectionStatusSchema = z.nativeEnum(InspectionStatus);
