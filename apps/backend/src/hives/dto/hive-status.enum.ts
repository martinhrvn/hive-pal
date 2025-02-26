import { HiveStatus } from '@prisma/client';

export enum HiveStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DEAD = 'DEAD',
  SOLD = 'SOLD',
  UNKNOWN = 'UNKNOWN',
}

export const mapPrismaHiveStatusToDto = (
  status: HiveStatus,
): HiveStatusEnum => {
  return HiveStatusEnum[status];
};

export const mapDtoHiveStatusToPrisma = (
  status: HiveStatusEnum,
): HiveStatus => {
  return HiveStatus[status];
};
