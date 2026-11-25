import { vi } from 'vitest';

// better-auth.ts reads DISABLE_REGISTRATION when it is first imported, so it
// has to be set before the app module graph loads. Vitest isolates each spec
// file, so this does not leak into the other suites.
vi.hoisted(() => {
  process.env.DISABLE_REGISTRATION = 'true';
});

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { MailService } from '../src/mail/mail.service';
import { createTestUser, loginAndGetCookie } from './helpers/auth';

/** Mail stub that pretends delivery is configured and records the links. */
class CapturingMailService {
  setupLinks = new Map<string, string>();
  magicLinks = new Map<string, string>();

  getMailStatus() {
    return { enabled: true };
  }

  sendAccountSetupEmail(email: string, url: string) {
    this.setupLinks.set(email, url);
    return Promise.resolve(true);
  }

  sendMagicLink(email: string, url: string) {
    this.magicLinks.set(email, url);
    return Promise.resolve(true);
  }

  sendPasswordResetEmail() {
    return Promise.resolve(true);
  }
}

/** Path + query of an absolute URL, for supertest. */
const pathOf = (url: string) => {
  const parsed = new URL(url);
  return parsed.pathname + parsed.search;
};

describe('Registration disabled (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const mail = new CapturingMailService();
  const adminEmail = 'reg-admin@example.com';
  const strangerEmail = 'reg-stranger@example.com';
  const magicEmail = 'reg-magic@example.com';
  const tempEmail = 'reg-temp@example.com';
  const setupEmail = 'reg-setup@example.com';
  const emails = [adminEmail, strangerEmail, magicEmail, tempEmail, setupEmail];
  let adminCookies: string[];

  async function cleanup() {
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mail)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    prisma = app.get(PrismaService);

    await cleanup();
    await createTestUser(prisma, {
      email: adminEmail,
      password: 'password',
      role: 'ADMIN',
    });
    adminCookies = await loginAndGetCookie(app, adminEmail, 'password');
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
    delete process.env.DISABLE_REGISTRATION;
  });

  it('rejects email sign-up', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .send({
        email: strangerEmail,
        password: 'password123',
        name: 'Stranger',
        privacyPolicyConsent: true,
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(
      await prisma.user.findUnique({ where: { email: strangerEmail } }),
    ).toBeNull();
  });

  it('does not create an account from a magic link for an unknown email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-in/magic-link')
      .send({ email: magicEmail, callbackURL: '/' });

    const link = mail.magicLinks.get(magicEmail);
    if (link) {
      await request(app.getHttpServer()).get(pathOf(link));
    }

    expect(
      await prisma.user.findUnique({ where: { email: magicEmail } }),
    ).toBeNull();
  });

  it('tells admins that registration is closed', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/admin/capabilities')
      .set('Cookie', adminCookies)
      .expect(200);
    expect(res.body).toEqual({ mailEnabled: true, registrationEnabled: false });
  });

  it('still lets an admin create a user with a temporary password', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Cookie', adminCookies)
      .send({
        credential: 'password',
        email: tempEmail,
        name: 'Temp User',
        role: 'ADMIN',
        password: 'temp-password-1',
      })
      .expect(201);

    expect(res.body).toMatchObject({
      role: 'ADMIN',
      passwordChangeRequired: true,
    });
    await loginAndGetCookie(app, tempEmail, 'temp-password-1');
  });

  it('emails a setup link that lets the user choose a password', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Cookie', adminCookies)
      .send({ credential: 'setupLink', email: setupEmail, name: 'Setup User' })
      .expect(201);
    expect(res.body.passwordChangeRequired).toBe(false);

    const link = mail.setupLinks.get(setupEmail);
    expect(link).toBeDefined();

    // The emailed link redirects to the frontend reset page with the token.
    const redirect = await request(app.getHttpServer())
      .get(pathOf(link!))
      .expect(302);
    const target = new URL(redirect.headers.location as string);
    expect(target.pathname).toBe('/reset-password');
    expect(target.searchParams.get('setup')).toBe('1');
    const token = target.searchParams.get('token');
    expect(token).toBeTruthy();

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'my-own-password' })
      .expect(200);

    await loginAndGetCookie(app, setupEmail, 'my-own-password');
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: setupEmail },
    });
    expect(user.passwordChangeRequired).toBe(false);
  });
});
