import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Increase timeout for e2e tests
jest.setTimeout(30000);

// Global setup before all tests
beforeAll(async () => {
  // Clean up specific tables if needed
  await prisma.inspectionNote.deleteMany();
  await prisma.observation.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.hive.deleteMany();
  await prisma.apiary.deleteMany();
  await prisma.user.deleteMany();
  // Add other tables as needed
});

// Global teardown after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
