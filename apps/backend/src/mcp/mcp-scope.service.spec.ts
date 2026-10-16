import { NotFoundException } from '@nestjs/common';
import { McpScopeService } from './mcp-scope.service';
import type { PrismaService } from '../prisma/prisma.service';

const makeService = (apiary: { id: string } | null) => {
  const findFirst = vi.fn().mockResolvedValue(apiary);
  const prisma = { apiary: { findFirst } } as unknown as PrismaService;
  return { service: new McpScopeService(prisma), findFirst };
};

describe('McpScopeService.resolve', () => {
  it('covers all accessible apiaries when no apiary is given', async () => {
    const { service, findFirst } = makeService(null);
    await expect(service.resolve('user-1')).resolves.toEqual({
      userId: 'user-1',
      allApiaries: true,
    });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('narrows to an apiary the user can access', async () => {
    const { service, findFirst } = makeService({ id: 'apiary-1' });
    await expect(service.resolve('user-1', 'apiary-1')).resolves.toEqual({
      userId: 'user-1',
      apiaryId: 'apiary-1',
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'apiary-1',
        OR: [
          { userId: 'user-1' },
          { members: { some: { userId: 'user-1', status: 'ACTIVE' } } },
        ],
      },
      select: { id: true },
    });
  });

  it("rejects another user's apiary", async () => {
    const { service } = makeService(null);
    await expect(service.resolve('user-1', 'apiary-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
