import { Logger } from '@nestjs/common';

const logger = new Logger('OidcLinking');

// Minimal slice of the Prisma client used here, so this stays unit-testable.
export interface OidcLinkingPrisma {
  user: {
    findUnique(args: {
      where: { id: string };
      select: { emailVerified: true };
    }): Promise<{ emailVerified: boolean } | null>;
    update(args: {
      where: { id: string };
      data: { emailVerified: boolean };
    }): Promise<unknown>;
  };
  account: {
    deleteMany(args: {
      where: { userId: string; providerId: string };
    }): Promise<{ count: number }>;
  };
  passkey: {
    deleteMany(args: { where: { userId: string } }): Promise<{ count: number }>;
  };
  session: {
    deleteMany(args: {
      where: { userId: string; createdAt: { lt: Date } };
    }): Promise<{ count: number }>;
  };
}

/**
 * Runs after an account row is created. When the OIDC provider gets attached
 * to a user whose email was never verified locally, the IdP has just proven
 * ownership of that address, so:
 *
 *  - if the link happened implicitly during an SSO sign-in (matched by email),
 *    the local password, passkeys and sessions are removed first. Otherwise
 *    someone could pre-register a password account with a colleague's address
 *    and keep access after the colleague's first SSO login ("pre-hijack").
 *    The real owner can still set a new password via "forgot password".
 *  - if the signed-in owner linked the account from their settings, nothing is
 *    removed — they already proved control of the local account.
 *
 * In both cases the email is then marked as verified.
 */
export async function secureOidcAccountLink(params: {
  prisma: OidcLinkingPrisma;
  providerId: string;
  account: { userId: string; providerId: string; createdAt: Date };
  /** Resolves whether the request is made by the already signed-in owner. */
  isLinkedBySignedInOwner: () => Promise<boolean>;
}): Promise<void> {
  const { prisma, providerId, account } = params;
  if (account.providerId !== providerId) return;

  const user = await prisma.user.findUnique({
    where: { id: account.userId },
    select: { emailVerified: true },
  });
  if (!user || user.emailVerified) return;

  if (!(await params.isLinkedBySignedInOwner())) {
    const userId = account.userId;
    const [credentials, passkeys, sessions] = await Promise.all([
      prisma.account.deleteMany({
        where: { userId, providerId: 'credential' },
      }),
      prisma.passkey.deleteMany({ where: { userId } }),
      // Database after-hooks run once the request completes, i.e. after the
      // SSO session was created. Only revoke sessions that predate the link.
      prisma.session.deleteMany({
        where: { userId, createdAt: { lt: account.createdAt } },
      }),
    ]);
    if (credentials.count + passkeys.count + sessions.count > 0) {
      logger.warn(
        `SSO linked to unverified account ${userId}: removed ${credentials.count} password credential(s), ${passkeys.count} passkey(s), ${sessions.count} session(s)`,
      );
    }
  }

  await prisma.user.update({
    where: { id: account.userId },
    data: { emailVerified: true },
  });
}
