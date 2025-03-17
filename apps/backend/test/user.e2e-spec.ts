import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { getRandomUser } from './fixtures/user';
describe('User (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testEmail = 'test-user@example.com';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);

    // Clean up test user if it exists
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
  });

  afterAll(async () => {
    // Clean up after tests
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
    await app.close();
  });

  it('should create a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: 'password123',
        name: 'Test User',
      })
      .expect(201);

    // Check response
    expect(response.body).toHaveProperty('access_token');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.email).toBe(testEmail);
    expect(response.body.user.name).toBe('Test User');
    expect(response.body.user).not.toHaveProperty('password');
    // Verify user was created in database
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    expect(user).toBeDefined();
    if (user) {
      expect(user.email).toBe(testEmail);
      expect(user.name).toBe('Test User');
      expect(user.role).toBe('USER');
    }
  });

  it('should not allow to create a user with the same email', async () => {
    await prisma.user.create({
      data: await getRandomUser({
        email: 'test@hivepal.com',
        password: 'password',
      }),
    });
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@hivepal.com',
        password: "doesn't matter",
        name: 'Test User',
      })
      .expect(401);
  });

  it('should allow to log in for existing user', async () => {
    await prisma.user.create({
      data: await getRandomUser({
        email: 'test2@hivepal.com',
        password: 'password',
      }),
    });
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@hivepal.com',
        password: 'password',
      })
      .expect(201);
  });

  it('should be possible to log in as admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@hivepal.com',
        password: 'StrongPassword',
      })
      .expect(201);
    expect(res.body).toHaveProperty('access_token');
  });
});
