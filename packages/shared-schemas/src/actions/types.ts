import { z } from 'zod';

export enum ActionType {
  FEEDING = 'FEEDING',
  TREATMENT = 'TREATMENT',
  FRAME = 'FRAME',
  HARVEST = 'HARVEST',
  OTHER = 'OTHER',
}

export const actionTypeSchema = z.nativeEnum(ActionType);
