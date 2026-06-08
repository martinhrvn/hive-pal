import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { hashPassword } from 'better-auth/crypto';
import { v4 as uuid } from 'uuid';

/**
 * Create a User + linked credential Account so the user can sign in via
 * Better Auth's /api/auth/sign-in/email endpoint.
 */
export async function createTestUser(
  prisma: PrismaService,
  opts: {
    email: string;
    password: string;
    name?: string;
    role?: 'USER' | 'ADMIN';
  },
): Promise<{ id: string; email: string }> {
  const user = await prisma.user.create({
    data: {
      id: uuid(),
      email: opts.email,
      name: opts.name ?? 'Test User',
      role: opts.role ?? 'USER',
      emailVerified: true,
      privacyPolicyConsent: true,
      newsletterConsent: false,
    },
  });
  await prisma.account.create({
    data: {
      id: uuid(),
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: await hashPassword(opts.password),
    },
  });
  return { id: user.id, email: user.email };
}

/**
 * Sign in via Better Auth and return the Set-Cookie array, ready to attach
 * to subsequent supertest requests with .set('Cookie', cookies).
 */
export async function loginAndGetCookie(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string[]> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/sign-in/email')
    .send({ email, password });
  const rawCookies = res.headers['set-cookie'] as unknown;
  const cookies = Array.isArray(rawCookies)
    ? rawCookies
    : typeof rawCookies === 'string'
      ? [rawCookies]
      : [];
  if (cookies.length === 0) {
    throw new Error(
      `Login failed: status ${res.status}, body=${JSON.stringify(res.body)}`,
    );
  }
  return cookies.map((c) => c.split(';')[0]);
}
