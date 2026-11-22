/**
 * Idempotent admin seeding script.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=<plaintext> \
 *     pnpm --filter backend exec tsx scripts/seed-admin.ts
 *
 * ADMIN_PASSWORD is a plaintext password: Better Auth hashes it (so it is what
 * you type to log in — not a pre-computed hash). Creates the admin user with
 * the ADMIN role; if the user already exists, only the role is promoted.
 *
 * Uses the admin plugin's createUser rather than sign-up, so it keeps working
 * when DISABLE_REGISTRATION closes public sign-up.
 */
import { auth } from '../src/auth/better-auth';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { authDeps } from '../src/auth/auth-deps';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Auth hooks use authDeps (the user-create hook adds the default apiary);
// populate before any auth API call. Nothing listens for events outside Nest,
// so a no-op emitter is enough.
authDeps.prisma = prisma as never;
authDeps.eventEmitter = { emit: () => true } as never;

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    // Skip rather than fail: the script runs unconditionally on container
    // startup, and deployments without a configured admin must still boot.
    console.log('ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin seeding');
    return;
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

  // Called without request headers, createUser runs as a trusted server call.
  await auth.api.createUser({
    body: {
      email,
      password,
      name: 'Admin',
      // Role goes through `data`: the typed `role` field only knows Better
      // Auth's default lowercase roles, while Hive Pal stores USER/ADMIN.
      data: { role: 'ADMIN', privacyPolicyConsent: true, emailVerified: true },
    },
  });
  console.log(`Created admin user ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
