import { z } from 'zod';

export enum HiveStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DEAD = 'DEAD',
  SOLD = 'SOLD',
  UNKNOWN = 'UNKNOWN',
  ARCHIVED = 'ARCHIVED',
}

export const hiveStatusSchema = z.nativeEnum(HiveStatus);