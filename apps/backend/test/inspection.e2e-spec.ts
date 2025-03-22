import request from 'supertest';
import { HiveStatusEnum } from '../src/hives/dto/hive-status.enum';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { getRandomUser } from './fixtures/user';
import { getRandomApiary } from './fixtures/apiary';
import { setupApiary, setupApp, setupHive, setupUser } from './fixtures/setup';
import { CreateInspectionDto } from '../src/inspections/dto/create-inspection.dto';
let app: INestApplication;
let prisma: PrismaService;
let authToken: string;
let userId: string;
let apiaryId: string;
let testHiveId: string;

beforeAll(async () => {
  ({ app, prisma } = await setupApp());
  ({ userId, authToken } = await setupUser(app));
  apiaryId = await setupApiary(app, userId);
  testHiveId = await setupHive(app, apiaryId);
});

it('should create a minimal inspection', async () => {
  const req: CreateInspectionDto = {
    date: new Date().toISOString(),
    hiveId: testHiveId,
    notes: 'This is a test inspection',
    temperature: 14.5,
    weatherConditions: 'sunny',
  };
  const response = await request(app.getHttpServer())
    .post('/inspections')
    .set('Authorization', `Bearer ${authToken}`)
    .set('x-apiary-id', apiaryId) // Set the apiary context
    .send(req)
    .expect(201);

  // Check response
  expect(response.body).toHaveProperty('id');
  expect(response.body).toEqual({
    date: req.date,
    hiveId: testHiveId,
    id: expect.any(String),
    status: 'COMPLETED',
    temperature: 14.5,
    weatherConditions: 'sunny',
  });

  const inspection = await prisma.inspection.findUnique({
    where: { id: response.body.id },
  });

  expect(inspection).toBeDefined();
  if (inspection) {
    expect(inspection.date.toISOString()).toBe(req.date);
    expect(inspection.temperature).toBe(14.5);
    expect(inspection.status).toBe('COMPLETED');
    expect(inspection.hiveId).toBe(testHiveId);
  }
});
