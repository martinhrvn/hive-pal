import { vi } from 'vitest';
import { secureSsoAccountLink } from './sso-linking';

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
const account = {
  id: 'a1',
  userId: 'u1',
  providerId: 'authentik',
  createdAt: linkedAt,
};
const providerIds = ['authentik', 'google'];

describe('secureSsoAccountLink', () => {
  it('ignores accounts of other providers', async () => {
    const prisma = makePrisma(false);
    await secureSsoAccountLink({
      prisma,
      providerIds,
      account: { ...account, providerId: 'credential' },
      isLinkedBySignedInOwner: () => Promise.resolve(false),
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('leaves verified accounts untouched', async () => {
    const prisma = makePrisma(true);
    const owner = vi.fn(() => Promise.resolve(false));
    await secureSsoAccountLink({
      prisma,
      providerIds,
      account,
      isLinkedBySignedInOwner: owner,
    });
    expect(owner).not.toHaveBeenCalled();
    expect(prisma.account.deleteMany).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('strips other sign-in methods on an implicit link to an unverified account', async () => {
    const prisma = makePrisma(false);
    await secureSsoAccountLink({
      prisma,
      providerIds,
      account,
      isLinkedBySignedInOwner: () => Promise.resolve(false),
    });
    expect(prisma.account.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', id: { not: 'a1' } },
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
    await secureSsoAccountLink({
      prisma,
      providerIds,
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

  it('applies to every configured SSO provider', async () => {
    const prisma = makePrisma(false);
    await secureSsoAccountLink({
      prisma,
      providerIds,
      account: { ...account, providerId: 'google' },
      isLinkedBySignedInOwner: () => Promise.resolve(false),
    });
    expect(prisma.account.deleteMany).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalled();
  });
});
