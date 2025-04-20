import { z } from 'zod';

export enum InspectionStatus {
  PENDING = 'PENDING',
  DONE = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const inspectionStatusSchema = z.nativeEnum(InspectionStatus);
