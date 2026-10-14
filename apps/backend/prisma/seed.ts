import { PrismaClient } from '@/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from 'better-auth/crypto';
import { randomUUID } from 'crypto';
import { seedDemoData } from '../scripts/demo-data';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const EMAIL = 'test@test.com';
const PASSWORD = 'password';

/**
 * Local development seed: a test@test.com / password user with the demo
 * dataset (see scripts/demo-data.ts). Safe to re-run: the user is created
 * once, and demo data is only added while that user has no hives.
 */
async function main() {
  let user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: EMAIL,
        name: 'Test User',
        emailVerified: true,
        privacyPolicyConsent: true,
      },
    });
    await prisma.account.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: await hashPassword(PASSWORD),
      },
    });
  }

  const hives = await prisma.hive.count({
    where: { apiary: { userId: user.id } },
  });
  if (hives > 0) {
    console.log(`${EMAIL} already has hives — skipping demo data`);
    return;
  }

  const result = await seedDemoData(prisma, user.id);
  console.log(
    `Seeded ${EMAIL} / ${PASSWORD}: ${result.hives} hives, ${result.inspections} inspections`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
