import { z } from 'zod';

export enum ActionType {
  FEEDING = 'FEEDING',
  TREATMENT = 'TREATMENT',
  FRAME = 'FRAME',
  OTHER = 'OTHER',
}

export const actionTypeSchema = z.nativeEnum(ActionType);
