import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

export function getRandomHive({
  name = 'Test Hive',
  apiaryId = uuid(),
  status = 'ACTIVE',
  notes = 'Test hive notes',
  installationDate = new Date(),
} = {}): Prisma.HiveUncheckedCreateInput {
  return {
    id: uuid(),
    name,
    notes,
    status: status as any, // Match enum in DB
    installationDate,
    apiaryId,
  };
}
