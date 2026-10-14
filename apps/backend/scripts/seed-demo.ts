/**
 * Fills the admin account with demo data on preview deployments.
 *
 * Runs on container startup after seed-admin. A no-op unless
 * SEED_DEMO_DATA=true (set in docker-compose.preview.yml only), and skips a
 * user who already has hives, so redeploys never duplicate or touch data.
 *
 *   SEED_DEMO_DATA=true ADMIN_EMAIL=admin@example.com \
 *     pnpm --filter backend exec tsx scripts/seed-demo.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { seedDemoData } from './demo-data';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  if (process.env.SEED_DEMO_DATA !== 'true') {
    console.log('SEED_DEMO_DATA not enabled — skipping demo data');
    return;
  }
  const email = process.env.ADMIN_EMAIL;
  const user = email
    ? await prisma.user.findUnique({ where: { email }, select: { id: true } })
    : null;
  if (!user) {
    console.log('No admin user to seed demo data for — skipping');
    return;
  }

  const hasHives = await prisma.hive.count({
    where: { apiary: { userId: user.id } },
  });
  if (hasHives > 0) {
    console.log(`${email} already has hives — skipping demo data`);
    return;
  }

  const result = await seedDemoData(prisma, user.id);
  console.log(
    `Seeded demo data for ${email}: ${result.hives} hives, ${result.inspections} inspections`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
