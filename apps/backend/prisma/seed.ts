import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data if needed
  await prisma.inspection.deleteMany();
  await prisma.queen.deleteMany();
  await prisma.hive.deleteMany();
  await prisma.apiary.deleteMany();

  // Create apiaries
  const homeApiary = await prisma.apiary.create({
    data: {
      name: 'Home Apiary',
      latitude: 42.3601,
      longitude: -71.0589,
    },
  });

  const mountainApiary = await prisma.apiary.create({
    data: {
      name: 'Mountain Site',
      latitude: 42.3701,
      longitude: -71.1089,
    },
  });

  // Create hives
  const hive1 = await prisma.hive.create({
    data: {
      name: 'Hive 01',
      apiaryId: homeApiary.id,
      status: 'ACTIVE',
      installationDate: new Date('2025-01-15'),
    },
  });

  const hive2 = await prisma.hive.create({
    data: {
      name: 'Hive 02',
      apiaryId: mountainApiary.id,
      status: 'ACTIVE',
      installationDate: new Date('2025-01-15'),
    },
  });

  // Create queens
  await prisma.queen.create({
    data: {
      hiveId: hive1.id,
      markingColor: 'RED',
      source: 'Local breeder',
      status: 'ACTIVE',
      installedAt: new Date('2025-01-15'),
    },
  });

  await prisma.queen.create({
    data: {
      hiveId: hive2.id,
      year: 2024,
      markingColor: 'WHITE',
      source: 'Package',
      status: 'ACTIVE',
      installedAt: new Date('2025-01-15'),
    },
  });

  // Create inspections
  await prisma.inspection.create({
    data: {
      hiveId: hive1.id,
      date: new Date('2025-02-01'),
      weatherConditions: 'Sunny',
      observations: {
        createMany: {
          data: [
            {
              type: 'BROOD_COUNT',
              numericValue: 5,
              notes: 'Healthy brood pattern',
            },
            {
              type: 'QUEEN_SEEN',
              numericValue: 1,
              notes: 'Queen spotted',
            },
          ],
        },
      },
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma
      .$disconnect()
      .then(() => process.exit())
      .catch(() => process.exit(1));
  });
