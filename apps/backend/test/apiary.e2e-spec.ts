import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { getRandomUser } from './fixtures/user';
import { getRandomApiary } from './fixtures/apiary';

describe('Apiaries (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let testApiaryId: string;

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
      email: 'apiary-test-user@example.com',
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
        email: 'apiary-test-user@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    // Clean up after tests
    await prisma.apiary.deleteMany({
      where: { userId },
    });
    await prisma.user.deleteMany({
      where: { id: userId },
    });
    await app.close();
  });

  it('should create a new apiary', async () => {
    const response = await request(app.getHttpServer())
      .post('/apiaries')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'My Test Apiary',
        location: 'Backyard',
        latitude: 35.6895,
        longitude: 139.6917,
      })
      .expect(201);

    // Check response
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('My Test Apiary');
    expect(response.body.location).toBe('Backyard');
    expect(response.body.latitude).toBe(35.6895);
    expect(response.body.longitude).toBe(139.6917);

    // Save the ID for later tests
    testApiaryId = response.body.id;

    // Verify apiary was created in database
    const apiary = await prisma.apiary.findUnique({
      where: { id: testApiaryId },
    });

    expect(apiary).toBeDefined();
    if (apiary) {
      expect(apiary.name).toBe('My Test Apiary');
      expect(apiary.location).toBe('Backyard');
      expect(apiary.latitude).toBe(35.6895);
      expect(apiary.longitude).toBe(139.6917);
      expect(apiary.userId).toBe(userId);
    }
  });

  it('should retrieve all apiaries for the authenticated user', async () => {
    // Create a few more apiaries for this user
    await prisma.apiary.createMany({
      data: [
        {
          ...getRandomApiary({
            userId,
            name: 'Second Apiary',
            location: 'Rooftop',
          }),
        },
        {
          ...getRandomApiary({
            userId,
            name: 'Third Apiary',
            location: 'Farm',
          }),
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/apiaries')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Should have at least 3 apiaries (including the one created in the previous test)
    expect(response.body.length).toBeGreaterThanOrEqual(3);

    // Check if our test apiary is in the results
    const foundApiary = response.body.find(
      (apiary) => apiary.id === testApiaryId,
    );
    expect(foundApiary).toBeDefined();
    expect(foundApiary.name).toBe('My Test Apiary');
  });

  it('should retrieve a specific apiary by ID', async () => {
    const response = await request(app.getHttpServer())
      .get(`/apiaries/${testApiaryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.id).toBe(testApiaryId);
    expect(response.body.name).toBe('My Test Apiary');
    expect(response.body.location).toBe('Backyard');
  });

  it('should update an existing apiary', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/apiaries/${testApiaryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Apiary Name',
        location: 'New Location',
      })
      .expect(200);

    expect(response.body.id).toBe(testApiaryId);
    expect(response.body.name).toBe('Updated Apiary Name');
    expect(response.body.location).toBe('New Location');

    // Verify the update in database
    const apiary = await prisma.apiary.findUnique({
      where: { id: testApiaryId },
    });

    expect(apiary?.name).toBe('Updated Apiary Name');
    expect(apiary?.location).toBe('New Location');
  });

  it('should delete an apiary', async () => {
    await request(app.getHttpServer())
      .delete(`/apiaries/${testApiaryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Verify the apiary was deleted
    const apiary = await prisma.apiary.findUnique({
      where: { id: testApiaryId },
    });

    expect(apiary).toBeNull();
  });

  it('should not retrieve apiaries from another user', async () => {
    // Create another user
    const anotherUser = await getRandomUser({
      email: 'another-user-2@example.com',
      password: 'password123',
    });

    await prisma.user.create({
      data: anotherUser,
    });

    // Create an apiary for the other user
    const otherUserApiary = await prisma.apiary.create({
      data: getRandomApiary({ userId: anotherUser.id, name: 'Private Apiary' }),
    });

    // Try to access the other user's apiary
    await request(app.getHttpServer())
      .get(`/apiaries/${otherUserApiary.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404); // Should not find it

    // Clean up the other user
    await prisma.apiary.delete({
      where: { id: otherUserApiary.id },
    });
    await prisma.user.delete({
      where: { id: anotherUser.id },
    });
  });
});
