import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { v4 as uuid } from 'uuid';
import { createTestUser, loginAndGetCookie } from '../helpers/auth';
import { getRandomHive } from './hive';
import { getRandomApiary } from './apiary';

export const setupApp = async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();

  const prisma = app.get(PrismaService);

  return { app, prisma };
};

export const setupUser = async (app: INestApplication) => {
  const prisma = app.get(PrismaService);
  const email = `test-${uuid()}@example.com`;
  const password = 'password123';
  const { id } = await createTestUser(prisma, { email, password });
  const authCookie = await loginAndGetCookie(app, email, password);
  return { userId: id, email, authCookie };
};

export const setupApiary = async (app: INestApplication, userId: string) => {
  const prisma = app.get(PrismaService);

  const apiary = await prisma.apiary.create({
    data: getRandomApiary({ userId }),
  });

  return apiary.id;
};

export const setupHive = async (app: INestApplication, apiaryId: string) => {
  const prisma = app.get(PrismaService);

  const hive = await prisma.hive.create({
    data: getRandomHive({ apiaryId }),
  });

  return hive.id;
};
