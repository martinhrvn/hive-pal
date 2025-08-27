import { z } from 'zod';

export enum ActionType {
  FEEDING = 'FEEDING',
  TREATMENT = 'TREATMENT',
  FRAME = 'FRAME',
  HARVEST = 'HARVEST',
  BOX_CONFIGURATION = 'BOX_CONFIGURATION',
  NOTE = 'NOTE',
  OTHER = 'OTHER',
}

export const actionTypeSchema = z.nativeEnum(ActionType);
