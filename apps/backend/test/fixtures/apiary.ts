import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

export function getRandomApiary({
  name = 'Test Apiary',
  location = 'Test Location',
  latitude = 40.7128, // New York latitude
  longitude = -74.006, // New York longitude
  userId = uuid(),
} = {}): Prisma.ApiaryUncheckedCreateInput {
  return {
    id: uuid(),
    name,
    location,
    latitude,
    longitude,
    userId,
  };
}
