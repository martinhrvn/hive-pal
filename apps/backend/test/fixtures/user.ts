import { Prisma } from '@/prisma/client';
import { v4 as uuid } from 'uuid';

/**
 * Returns a Prisma.UserCreateInput for direct DB insert. Credentials live in
 * the Account table now; use `createTestUser` from test/helpers/auth.ts when
 * the test needs to log in.
 */
export function getRandomUser({
  email,
}: {
  email?: string;
  password?: string;
} = {}): Prisma.UserCreateInput {
  return {
    email: email ?? `test-${uuid()}@example.com`,
    name: 'Test User',
    role: 'USER',
    id: uuid(),
    emailVerified: true,
    newsletterConsent: true,
    privacyPolicyConsent: true,
  };
}
