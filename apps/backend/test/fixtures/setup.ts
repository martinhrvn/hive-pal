import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { getRandomUser } from './user';
import request from 'supertest';
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

  const testUser = await getRandomUser();
  const { id } = await prisma.user.create({
    data: testUser,
  });
  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      email: testUser.email,
      password: 'password123',
    });

  return {
    userId: id,
    email: testUser.email,
    authToken: loginResponse.body.access_token,
  };
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
