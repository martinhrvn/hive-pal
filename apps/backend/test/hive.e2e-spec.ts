import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { getRandomUser } from './fixtures/user';
import { getRandomApiary } from './fixtures/apiary';
import { getRandomHive } from './fixtures/hive';
import { HiveStatusEnum } from '../src/hives/dto/hive-status.enum';
import {
  BoxTypeDto,
  UpdateHiveBoxesDto,
} from '../src/hives/dto/update-hive-boxes.dto';

describe('Hives (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let apiaryId: string;
  let testHiveId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);

    // Register a test user and get authentication token
    const testUser = await getRandomUser({
      email: 'hive-test-user@example.com',
      password: 'password123',
    });
    userId = testUser.id!;

    // Create the user directly in the database
    await prisma.user.create({
      data: testUser,
    });

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'hive-test-user@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.access_token;

    // Create a test apiary for the user
    const apiary = await prisma.apiary.create({
      data: getRandomApiary({
        userId,
        name: 'Test Apiary for Hives',
      }),
    });
    apiaryId = apiary.id;
  });

  afterAll(async () => {
    // Clean up after tests
    await prisma.box.deleteMany({
      where: {
        hive: {
          apiary: {
            userId,
          },
        },
      },
    });
    await prisma.hive.deleteMany({
      where: {
        apiary: {
          userId,
        },
      },
    });
    await prisma.apiary.deleteMany({
      where: { userId },
    });
    await prisma.user.deleteMany({
      where: { id: userId },
    });
    await app.close();
  });

  it('should create a new hive', async () => {
    const response = await request(app.getHttpServer())
      .post('/hives')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-apiary-id', apiaryId) // Set the apiary context
      .send({
        name: 'My Test Hive',
        notes: 'This is a test hive',
        apiaryId, // Use the created apiary
        installationDate: new Date().toISOString(),
        status: HiveStatusEnum.ACTIVE,
      })
      .expect(201);

    // Check response
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('My Test Hive');
    expect(response.body.apiaryId).toBe(apiaryId);
    expect(response.body.status).toBe(HiveStatusEnum.ACTIVE);
    expect(response.body.notes).toBe('This is a test hive');

    // Save the ID for later tests
    testHiveId = response.body.id;

    // Verify hive was created in database
    const hive = await prisma.hive.findUnique({
      where: { id: testHiveId },
    });

    expect(hive).toBeDefined();
    if (hive) {
      expect(hive.name).toBe('My Test Hive');
      expect(hive.apiaryId).toBe(apiaryId);
      expect(hive.status).toBe('ACTIVE'); // DB enum might be different from DTO
      expect(hive.notes).toBe('This is a test hive');
    }
  });

  it('should retrieve all hives for a specific apiary', async () => {
    // Create a few more hives for this apiary
    await prisma.hive.createMany({
      data: [
        {
          ...getRandomHive({ apiaryId, name: 'Second Hive' }),
        },
        {
          ...getRandomHive({ apiaryId, name: 'Third Hive' }),
        },
      ],
    });

    // Create a second apiary and hives in it (should not be returned in our test)
    const secondApiary = await prisma.apiary.create({
      data: getRandomApiary({ userId, name: 'Another Test Apiary' }),
    });

    await prisma.hive.create({
      data: getRandomHive({
        apiaryId: secondApiary.id,
        name: 'Hive in another apiary',
      }),
    });

    const response = await request(app.getHttpServer())
      .get('/hives')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-apiary-id', apiaryId) // Set the apiary context
      .expect(200);

    // Should have exactly 3 hives (the ones we created for this apiary)
    expect(response.body.length).toBe(3);

    // Check if our test hive is in the results
    const foundHive = response.body.find((hive) => hive.id === testHiveId);
    expect(foundHive).toBeDefined();
    expect(foundHive.name).toBe('My Test Hive');

    // Make sure we don't have hives from other apiaries
    const otherApiaryHives = response.body.filter(
      (hive) => hive.apiaryId !== apiaryId,
    );
    expect(otherApiaryHives.length).toBe(0);
  });

  it('should retrieve a specific hive by ID', async () => {
    const response = await request(app.getHttpServer())
      .get(`/hives/${testHiveId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-apiary-id', apiaryId)
      .expect(200);

    expect(response.body.id).toBe(testHiveId);
    expect(response.body.name).toBe('My Test Hive');
    expect(response.body.notes).toBe('This is a test hive');
    expect(response.body.apiaryId).toBe(apiaryId);

    // Check that boxes array exists (should be empty)
    expect(response.body).toHaveProperty('boxes');
    expect(Array.isArray(response.body.boxes)).toBe(true);
  });

  it('should update an existing hive', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/hives/${testHiveId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-apiary-id', apiaryId)
      .send({
        name: 'Updated Hive Name',
        notes: 'Updated notes',
        status: HiveStatusEnum.INACTIVE,
      })
      .expect(200);

    expect(response.body.id).toBe(testHiveId);
    expect(response.body.name).toBe('Updated Hive Name');
    expect(response.body.notes).toBe('Updated notes');
    expect(response.body.status).toBe('INACTIVE');

    // Verify the update in database
    const hive = await prisma.hive.findUnique({
      where: { id: testHiveId },
    });

    expect(hive?.name).toBe('Updated Hive Name');
    expect(hive?.notes).toBe('Updated notes');
    expect(hive?.status).toBe('INACTIVE');
  });

  it('should update boxes for a hive', async () => {
    const boxData = {
      boxes: [
        {
          position: 0,
          frameCount: 8,
          maxFrameCount: 10,
          hasExcluder: false,
          type: 'BROOD',
        },
        {
          position: 1,
          frameCount: 6,
          maxFrameCount: 10,
          hasExcluder: true,
          type: 'HONEY',
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .put(`/hives/${testHiveId}/boxes`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-apiary-id', apiaryId)
      .send(boxData)
      .expect(200);

    expect(response.body.id).toBe(testHiveId);
    expect(response.body.boxes).toHaveLength(2);
    expect(response.body.boxes[0].position).toBe(0);
    expect(response.body.boxes[0].type).toBe('BROOD');
    expect(response.body.boxes[1].position).toBe(1);
    expect(response.body.boxes[1].type).toBe('HONEY');
    expect(response.body.boxes[1].hasExcluder).toBe(true);

    // Verify in the database
    const boxes = await prisma.box.findMany({
      where: { hiveId: testHiveId },
      orderBy: { position: 'asc' },
    });

    expect(boxes).toHaveLength(2);
    expect(boxes[0].type).toBe('BROOD');
    expect(boxes[1].type).toBe('HONEY');
  });

  it('should delete a hive', async () => {
    await request(app.getHttpServer())
      .delete(`/hives/${testHiveId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-apiary-id', apiaryId)
      .expect(200);

    // Verify the hive was deleted
    const hive = await prisma.hive.findUnique({
      where: { id: testHiveId },
    });

    expect(hive?.status).toBe('ARCHIVED');
  });

  it('should not fetch archived hives', async () => {
    // Create an archived hive
    const archivedHive = await prisma.hive.create({
      data: getRandomHive({
        apiaryId,
        name: 'Archived Hive',
        status: HiveStatusEnum.ARCHIVED,
      }),
    });

    // Try to fetch it
    const res = await request(app.getHttpServer())
      .get(`/hives`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-apiary-id', apiaryId)
      .expect(200);
    res.body.forEach((hive: any) => {
      expect(hive.status).not.toBe('ARCHIVED');
    });
  });

  it('should fetch archived hives with query param includeInactive=true', async () => {
    // Create an archived hive
    const archivedHive = await prisma.hive.create({
      data: getRandomHive({
        apiaryId,
        name: 'Archived Hive',
        status: HiveStatusEnum.ARCHIVED,
      }),
    });

    // Try to fetch it
    const res = await request(app.getHttpServer())
      .get(`/hives`)
      .query({ includeInactive: true })
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-apiary-id', apiaryId)
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
    const archivedHiveResponse = res.body.find(
      (hive: any) => hive.id === archivedHive.id,
    );
    expect(archivedHiveResponse).toBeDefined();
  });

  it('should not allow access to hives in a different apiary', async () => {
    // Create a new apiary
    const otherApiary = await prisma.apiary.create({
      data: getRandomApiary({ userId, name: 'Other Apiary' }),
    });

    // Create a hive in that apiary
    const otherHive = await prisma.hive.create({
      data: getRandomHive({
        apiaryId: otherApiary.id,
        name: 'Hive in other apiary',
      }),
    });

    // Try to access it with the wrong apiary context
    await request(app.getHttpServer())
      .get(`/hives/${otherHive.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-apiary-id', apiaryId) // Using our original apiary ID
      .expect(404); // Should get not found

    // But should work with the correct apiary ID
    const response = await request(app.getHttpServer())
      .get(`/hives/${otherHive.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-apiary-id', otherApiary.id) // Using the correct apiary ID
      .expect(200);

    expect(response.body.id).toBe(otherHive.id);
    expect(response.body.name).toBe('Hive in other apiary');
  });

  it('should accept apiaryId as query parameter', async () => {
    // Create a hive
    const queryTestHive = await prisma.hive.create({
      data: getRandomHive({
        apiaryId,
        name: 'Hive for query param test',
      }),
    });

    // Try to access it with apiaryId as query parameter instead of header
    const response = await request(app.getHttpServer())
      .get(`/hives/${queryTestHive.id}?apiaryId=${apiaryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      // Not setting x-apiary-id header
      .expect(200);

    expect(response.body.id).toBe(queryTestHive.id);
    expect(response.body.name).toBe('Hive for query param test');
  });

  it('should not allow access to hives with invalid apiary context', async () => {
    // Try with non-existent apiary ID
    await request(app.getHttpServer())
      .get('/hives')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-apiary-id', '00000000-0000-0000-0000-000000000000')
      .expect(404);

    // Try without any apiary context
    const res = await request(app.getHttpServer())
      .get('/hives')
      .set('Authorization', `Bearer ${authToken}`)
      // No x-apiary-id header or query param
      .expect(200);
    const ids = res.body.map((hive: any) => hive.id);
    const dbIds = await prisma.hive.findMany({
      where: {
        status: 'ACTIVE',
        apiary: {
          userId,
        },
      },
      include: {
        apiary: true,
      },
    });
    expect(ids).toEqual(dbIds.map((hive) => hive.id));
  });
});
