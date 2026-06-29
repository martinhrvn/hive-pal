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

// Whether auth cookies get the `Secure` attribute.
//
// Browsers silently drop `Secure` cookies sent over plain http on every host
// except localhost, so a deployment served over http (e.g. a LAN host/IP
// behind a TLS-less reverse proxy) MUST issue non-Secure cookies or login
// breaks with no server-side error (the session cookie is set but never stored
// or replayed by the browser).
//
// Precedence:
//   1. BETTER_AUTH_SECURE_COOKIES=true|false — explicit override
//   2. otherwise: Secure only when BETTER_AUTH_URL is https:// — i.e. derived
//      from the protocol the app is actually served over (this also matches
//      Better Auth's own default behaviour).
const useSecureCookies =
  process.env.BETTER_AUTH_SECURE_COOKIES !== undefined
    ? process.env.BETTER_AUTH_SECURE_COOKIES.toLowerCase() === 'true'
    : (process.env.BETTER_AUTH_URL ?? '').startsWith('https://');

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
    // Apply the Secure decision globally so EVERY auth cookie agrees
    // (session_token, the session_data cache cookie, CSRF, etc.). Previously
    // only session_token carried an override, which left session_data Secure
    // while session_token wasn't (or vice versa) and silently broke sessions
    // over http. See the `useSecureCookies` definition above.
    useSecureCookies,
    cookies: {
      session_token: {
        attributes: {
          sameSite: 'lax',
          secure: useSecureCookies,
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
    user: {
      create: {
        after: async (user) => {
          // Auto-create a default apiary so new users land in a usable app
          // instead of being forced through onboarding. Location is left null
          // intentionally — weather stays off until the user sets coordinates.
          await authDeps.prisma.apiary.create({
            data: {
              name: 'My Apiary',
              userId: user.id,
              settings: { inspectionType: 'data_driven' },
            },
          });
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          const dbUser = await authDeps.prisma.user.findUnique({
            where: { id: session.userId },
            select: { lastLoginAt: true, email: true, role: true },
          });
          if (!dbUser) return;
          const previousLoginAt = dbUser.lastLoginAt;
          // Self-heal the configured admin account: whoever logs in with
          // ADMIN_EMAIL always gets the ADMIN role, regardless of how/when the
          // account was created (covers signups that pre-date or bypass the
          // startup seed). Comparison is case-insensitive.
          const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
          const promoteToAdmin =
            !!adminEmail &&
            dbUser.email.toLowerCase() === adminEmail &&
            dbUser.role !== 'ADMIN';
          await authDeps.prisma.user.update({
            where: { id: session.userId },
            data: {
              lastLoginAt: new Date(),
              ...(promoteToAdmin ? { role: 'ADMIN' } : {}),
            },
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
