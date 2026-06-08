import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { magicLink, admin, customSession } from 'better-auth/plugins';
import { passkey } from '@better-auth/passkey';
import { createAuthMiddleware } from 'better-auth/api';
import {
  hashPassword as scryptHash,
  verifyPassword as scryptVerify,
} from 'better-auth/crypto';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { authDeps } from './auth-deps';
import { UserLoginEvent } from '../events/auth.events';

const prismaForAuth = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const isBcryptHash = (hash: string): boolean =>
  hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');

export const auth = betterAuth({
  database: prismaAdapter(prismaForAuth, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.FRONTEND_URL ?? 'http://localhost:5173'],

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    password: {
      hash: scryptHash,
      verify: async ({ password, hash }) => {
        if (isBcryptHash(hash)) {
          return bcrypt.compare(password, hash);
        }
        return scryptVerify({ password, hash });
      },
    },
    sendResetPassword: async ({ user, url }) => {
      await authDeps.mail.sendPasswordResetEmail(user.email, url);
    },
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'USER',
        input: false,
      },
      passwordChangeRequired: {
        type: 'boolean',
        defaultValue: false,
        input: false,
      },
      lastLoginAt: { type: 'date', required: false, input: false },
      privacyPolicyConsent: { type: 'boolean', defaultValue: false },
      privacyConsentTimestamp: { type: 'date', required: false },
      newsletterConsent: { type: 'boolean', defaultValue: false },
      newsletterConsentTimestamp: { type: 'date', required: false },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  advanced: {
    cookies: {
      session_token: {
        attributes: {
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          ...(process.env.COOKIE_DOMAIN
            ? { domain: process.env.COOKIE_DOMAIN }
            : {}),
        },
      },
    },
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Lazy bcrypt → scrypt rehash on successful email sign-in
      if (
        ctx.path === '/sign-in/email' &&
        (ctx.context as { newSession?: { user: { id: string } } }).newSession
      ) {
        const plain = (ctx.body as { password?: string } | undefined)?.password;
        if (plain) {
          const userId = (
            ctx.context as { newSession: { user: { id: string } } }
          ).newSession.user.id;
          const account = await authDeps.prisma.account.findFirst({
            where: { userId, providerId: 'credential' },
          });
          if (account?.password && isBcryptHash(account.password)) {
            const newHash = await scryptHash(plain);
            await authDeps.prisma.account.update({
              where: { id: account.id },
              data: { password: newHash },
            });
          }
        }
      }

      // Admin resetting another user's password → mark target user as needing change
      if (ctx.path === '/admin/set-user-password') {
        const body = ctx.body as { userId?: string } | undefined;
        if (body?.userId) {
          await authDeps.prisma.user.update({
            where: { id: body.userId },
            data: { passwordChangeRequired: true },
          });
        }
      }

      // User changing their own password → clear the flag
      if (ctx.path === '/change-password') {
        const session = (ctx.context as { session?: { user?: { id: string } } })
          .session;
        if (session?.user?.id) {
          await authDeps.prisma.user.update({
            where: { id: session.user.id },
            data: { passwordChangeRequired: false },
          });
        }
      }
    }),
  },

  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          const dbUser = await authDeps.prisma.user.findUnique({
            where: { id: session.userId },
            select: { lastLoginAt: true, email: true },
          });
          if (!dbUser) return;
          const previousLoginAt = dbUser.lastLoginAt;
          await authDeps.prisma.user.update({
            where: { id: session.userId },
            data: { lastLoginAt: new Date() },
          });
          authDeps.eventEmitter.emit(
            'user.login',
            new UserLoginEvent(session.userId, dbUser.email, previousLoginAt),
          );
        },
      },
    },
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await authDeps.mail.sendMagicLink(email, url);
      },
      expiresIn: 60 * 15,
    }),
    passkey({
      rpID: process.env.PASSKEY_RP_ID ?? 'localhost',
      rpName: 'Hive Pal',
      origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    }),
    admin({
      defaultRole: 'USER',
      adminRoles: ['ADMIN'],
    }),
    customSession(async ({ user, session }) => {
      const dbUser = await authDeps.prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordChangeRequired: true, role: true },
      });
      return {
        user: {
          ...user,
          role: dbUser?.role ?? 'USER',
          passwordChangeRequired: dbUser?.passwordChangeRequired ?? false,
        },
        session,
      };
    }),
  ],
});

export type Auth = typeof auth;
