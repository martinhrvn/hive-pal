import { vi } from 'vitest';
import { secureOidcAccountLink } from './oidc-linking';

const makePrisma = (emailVerified: boolean | null) => ({
  user: {
    findUnique: vi.fn(() =>
      Promise.resolve(emailVerified === null ? null : { emailVerified }),
    ),
    update: vi.fn(() => Promise.resolve({})),
  },
  account: { deleteMany: vi.fn(() => Promise.resolve({ count: 1 })) },
  passkey: { deleteMany: vi.fn(() => Promise.resolve({ count: 0 })) },
  session: { deleteMany: vi.fn(() => Promise.resolve({ count: 2 })) },
});

const linkedAt = new Date('2026-01-01T00:00:00Z');
const account = { userId: 'u1', providerId: 'authentik', createdAt: linkedAt };

describe('secureOidcAccountLink', () => {
  it('ignores accounts of other providers', async () => {
    const prisma = makePrisma(false);
    await secureOidcAccountLink({
      prisma,
      providerId: 'authentik',
      account: { ...account, providerId: 'credential' },
      isLinkedBySignedInOwner: () => Promise.resolve(false),
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('leaves verified accounts untouched', async () => {
    const prisma = makePrisma(true);
    const owner = vi.fn(() => Promise.resolve(false));
    await secureOidcAccountLink({
      prisma,
      providerId: 'authentik',
      account,
      isLinkedBySignedInOwner: owner,
    });
    expect(owner).not.toHaveBeenCalled();
    expect(prisma.account.deleteMany).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('strips local credentials on an implicit link to an unverified account', async () => {
    const prisma = makePrisma(false);
    await secureOidcAccountLink({
      prisma,
      providerId: 'authentik',
      account,
      isLinkedBySignedInOwner: () => Promise.resolve(false),
    });
    expect(prisma.account.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', providerId: 'credential' },
    });
    expect(prisma.passkey.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
    });
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', createdAt: { lt: linkedAt } },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { emailVerified: true },
    });
  });

  it('keeps credentials when the signed-in owner links the account', async () => {
    const prisma = makePrisma(false);
    await secureOidcAccountLink({
      prisma,
      providerId: 'authentik',
      account,
      isLinkedBySignedInOwner: () => Promise.resolve(true),
    });
    expect(prisma.account.deleteMany).not.toHaveBeenCalled();
    expect(prisma.session.deleteMany).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { emailVerified: true },
    });
  });
});
