import { z } from 'zod';

export enum ActionType {
  FEEDING = 'FEEDING',
  TREATMENT = 'TREATMENT',
  FRAME = 'FRAME',
  HARVEST = 'HARVEST',
  BOX_CONFIGURATION = 'BOX_CONFIGURATION',
  MAINTENANCE = 'MAINTENANCE',
  NOTE = 'NOTE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  OTHER = 'OTHER',
}

export const actionTypeSchema = z.nativeEnum(ActionType);
