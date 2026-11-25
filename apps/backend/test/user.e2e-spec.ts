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
  const createdEmail = 'admin-created@example.com';
  const testEmails = [
    testEmail,
    'test@hivepal.com',
    'test2@hivepal.com',
    adminEmail,
    nonAdminEmail,
    createdEmail,
    'short-pass@example.com',
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

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body).toMatchObject({ page: 1, pageSize: 25 });
    expect(res.body.total).toBeGreaterThanOrEqual(res.body.items.length);
  });

  describe('admin user management', () => {
    let adminCookies: string[];

    beforeAll(async () => {
      adminCookies = await loginAndGetCookie(app, adminEmail, 'password');
    });

    it('searches users by email or name, case-insensitively', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .query({ search: 'REGULAR-GUARD' })
        .set('Cookie', adminCookies)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.items[0]).toMatchObject({
        email: nonAdminEmail,
        role: 'USER',
        banned: false,
      });
      expect(res.body.items[0].stats).toHaveProperty('apiariesCount');
      // Only admin-safe fields are exposed.
      expect(res.body.items[0]).not.toHaveProperty('preferences');
    });

    it('filters by role and ban status', async () => {
      const admins = await request(app.getHttpServer())
        .get('/users')
        .query({ role: 'ADMIN' })
        .set('Cookie', adminCookies)
        .expect(200);
      expect(
        admins.body.items.every((u: { role: string }) => u.role === 'ADMIN'),
      ).toBe(true);

      await prisma.user.update({
        where: { email: nonAdminEmail },
        data: { banned: true, banReason: 'spam' },
      });
      const banned = await request(app.getHttpServer())
        .get('/users')
        .query({ status: 'banned' })
        .set('Cookie', adminCookies)
        .expect(200);
      expect(banned.body.items.map((u: { email: string }) => u.email)).toEqual([
        nonAdminEmail,
      ]);

      const active = await request(app.getHttpServer())
        .get('/users')
        .query({ status: 'active', search: 'guard' })
        .set('Cookie', adminCookies)
        .expect(200);
      expect(active.body.items.map((u: { email: string }) => u.email)).toEqual([
        adminEmail,
      ]);

      await prisma.user.update({
        where: { email: nonAdminEmail },
        data: { banned: false, banReason: null },
      });
    });

    it('pages through results', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .query({ pageSize: 1, page: 2, sort: 'email', order: 'asc' })
        .set('Cookie', adminCookies)
        .expect(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.page).toBe(2);
    });

    it('rejects invalid list parameters', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .query({ pageSize: 1000 })
        .set('Cookie', adminCookies)
        .expect(400);
    });

    it('reports user management capabilities', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/admin/capabilities')
        .set('Cookie', adminCookies)
        .expect(200);
      expect(res.body).toEqual({
        mailEnabled: expect.any(Boolean),
        registrationEnabled: true,
      });
    });

    it('forbids non-admins from creating and deleting users', async () => {
      const cookies = await loginAndGetCookie(app, nonAdminEmail, 'password');
      await request(app.getHttpServer())
        .post('/users')
        .set('Cookie', cookies)
        .send({
          credential: 'password',
          email: createdEmail,
          name: 'Nope',
          password: 'password123',
        })
        .expect(403);
      const admin = await prisma.user.findUniqueOrThrow({
        where: { email: adminEmail },
      });
      await request(app.getHttpServer())
        .delete(`/users/${admin.id}`)
        .set('Cookie', cookies)
        .expect(403);
    });

    it('creates a user with a temporary password', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Cookie', adminCookies)
        .send({
          credential: 'password',
          email: createdEmail.toUpperCase(),
          name: 'Created User',
          password: 'temp-password-1',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        email: createdEmail,
        name: 'Created User',
        role: 'USER',
        passwordChangeRequired: true,
      });
      // The user-create hook still gives them a default apiary.
      const apiaries = await prisma.apiary.count({
        where: { userId: res.body.id },
      });
      expect(apiaries).toBe(1);
      // They can sign in with the temporary password.
      await loginAndGetCookie(app, createdEmail, 'temp-password-1');
    });

    it('rejects a duplicate email with 409', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Cookie', adminCookies)
        .send({
          credential: 'password',
          email: createdEmail,
          name: 'Again',
          password: 'temp-password-1',
        })
        .expect(409);
    });

    it('rejects a temporary password that is too short', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Cookie', adminCookies)
        .send({
          credential: 'password',
          email: 'short-pass@example.com',
          name: 'Short',
          password: 'short',
        })
        .expect(400);
    });

    // Better Auth's admin plugin checks permissions by role name; Hive Pal's
    // upper-case ADMIN role must map onto its admin access-control role.
    it('lets an ADMIN use the Better Auth admin endpoints', async () => {
      const target = await prisma.user.findUniqueOrThrow({
        where: { email: nonAdminEmail },
      });
      const post = (path: string, body: object) =>
        request(app.getHttpServer())
          .post(`/api/auth/admin/${path}`)
          .set('Cookie', adminCookies)
          .send(body);

      await post('set-user-password', {
        userId: target.id,
        newPassword: 'password',
      }).expect(200);
      await post('set-role', { userId: target.id, role: 'ADMIN' }).expect(200);
      await post('set-role', { userId: target.id, role: 'USER' }).expect(200);
      await post('ban-user', { userId: target.id, banReason: 'test' }).expect(
        200,
      );
      await post('unban-user', { userId: target.id }).expect(200);

      const after = await prisma.user.findUniqueOrThrow({
        where: { id: target.id },
      });
      expect(after).toMatchObject({
        role: 'USER',
        banned: false,
        passwordChangeRequired: true,
      });
      await prisma.user.update({
        where: { id: target.id },
        data: { passwordChangeRequired: false },
      });
    });

    it('refuses to let an admin delete themselves', async () => {
      const admin = await prisma.user.findUniqueOrThrow({
        where: { email: adminEmail },
      });
      await request(app.getHttpServer())
        .delete(`/users/${admin.id}`)
        .set('Cookie', adminCookies)
        .expect(400);
    });

    it('deletes a user and their data', async () => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { email: createdEmail },
      });
      await request(app.getHttpServer())
        .delete(`/users/${user.id}`)
        .set('Cookie', adminCookies)
        .expect(204);

      expect(
        await prisma.user.findUnique({ where: { id: user.id } }),
      ).toBeNull();
      expect(await prisma.apiary.count({ where: { userId: user.id } })).toBe(0);

      await request(app.getHttpServer())
        .delete(`/users/${user.id}`)
        .set('Cookie', adminCookies)
        .expect(404);
    });
  });
});
