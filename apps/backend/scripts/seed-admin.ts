/**
 * Idempotent admin seeding script.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@hivepal.com ADMIN_PASSWORD=... \
 *     pnpm --filter backend exec tsx scripts/seed-admin.ts
 *
 * Creates the admin user via Better Auth's sign-up flow (so credentials hash
 * correctly), then promotes the User row's `role` to 'ADMIN'. If the user
 * already exists, only the role is promoted.
 */
import { auth } from '../src/auth/better-auth';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { authDeps } from '../src/auth/auth-deps';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// auth hooks reference authDeps.prisma; populate before any auth API call.
authDeps.prisma = prisma as never;

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    console.log(`Promoted existing user ${email} to ADMIN`);
    return;
  }

  await auth.api.signUpEmail({
    body: { email, password, name: 'Admin' },
  });
  await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN', privacyPolicyConsent: true, emailVerified: true },
  });
  console.log(`Created admin user ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
