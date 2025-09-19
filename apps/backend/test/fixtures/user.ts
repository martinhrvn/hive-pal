import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

export async function getRandomUser({
  email,
  password = 'password123',
}: {
  email?: string;
  password?: string;
} = {}): Promise<Prisma.UserCreateInput> {
  return {
    email: email ?? `test-${uuid()}@example.com`,
    password: await bcrypt.hash(password, 10),
    name: 'Test User',
    role: 'USER',
    id: uuid(),
    newsletterConsent: true,
    privacyPolicyConsent: true
  };
}
