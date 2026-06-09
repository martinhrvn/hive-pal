import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { createTestUser, loginAndGetCookie } from './helpers/auth';

describe('User (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testEmail = 'test-user@example.com';
  const adminEmail = 'admin-guard@example.com';
  const nonAdminEmail = 'regular-guard@example.com';
  const testEmails = [
    testEmail,
    'test@hivepal.com',
    'test2@hivepal.com',
    adminEmail,
    nonAdminEmail,
  ];

  async function cleanupTestUsers() {
    const users = await prisma.user.findMany({
      where: { email: { in: testEmails } },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    if (userIds.length > 0) {
      await prisma.apiary.deleteMany({ where: { userId: { in: userIds } } });
    }
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);

    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await app.close();
  });

  it('should create a new user via Better Auth sign-up', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .send({
        email: testEmail,
        password: 'password123',
        name: 'Test User',
        newsletterConsent: true,
        privacyPolicyConsent: true,
      })
      .expect(200);

    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.email).toBe(testEmail);
    expect(response.body.user.name).toBe('Test User');

    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user).toBeDefined();
    expect(user?.role).toBe('USER');
  });

  it('should not allow signing up with an existing email', async () => {
    await createTestUser(prisma, {
      email: 'test@hivepal.com',
      password: 'password',
    });
    const res = await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .send({
        email: 'test@hivepal.com',
        password: "doesn't matter",
        name: 'Test User',
      });
    // Better Auth returns 422 (UNPROCESSABLE) for duplicate email
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should allow an existing user to log in', async () => {
    await createTestUser(prisma, {
      email: 'test2@hivepal.com',
      password: 'password',
    });
    const cookies = await loginAndGetCookie(
      app,
      'test2@hivepal.com',
      'password',
    );
    expect(cookies.length).toBeGreaterThan(0);
  });

  it('should forbid a non-admin from listing all users (RolesGuard)', async () => {
    await createTestUser(prisma, {
      email: nonAdminEmail,
      password: 'password',
      role: 'USER',
    });
    const cookies = await loginAndGetCookie(app, nonAdminEmail, 'password');

    await request(app.getHttpServer())
      .get('/users')
      .set('Cookie', cookies)
      .expect(403);
  });

  it('should allow an admin to list all users (RolesGuard)', async () => {
    await createTestUser(prisma, {
      email: adminEmail,
      password: 'password',
      role: 'ADMIN',
    });
    const cookies = await loginAndGetCookie(app, adminEmail, 'password');

    const res = await request(app.getHttpServer())
      .get('/users')
      .set('Cookie', cookies)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
