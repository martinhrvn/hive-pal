import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

export async function getRandomUser({
  email = 'test@user.com',
  password = 'password123',
} = {}): Promise<Prisma.UserCreateInput> {
  return {
    email,
    password: await bcrypt.hash(password, 10),
    name: 'Test User',
    role: 'USER',
    id: uuid(),
  };
}
