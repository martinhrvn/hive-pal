import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QueensService } from './queens.service';
import { createServiceTestModule } from '../test/service-test.helper';
import { apiaryWriteAccessWhere } from '../common';

describe('QueensService', () => {
  let service: QueensService;

  beforeEach(async () => {
    const { service: svc } = await createServiceTestModule(QueensService);
    service = svc;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordTransfer', () => {
    const filter = { apiaryId: 'apiary-a', userId: 'user-1' };
    const queenRow = {
      id: 'q1',
      hiveId: 'hive-b',
      name: null,
      marking: null,
      color: null,
      year: null,
      source: null,
      status: 'ACTIVE',
      installedAt: null,
      replacedAt: null,
      hive: {
        name: 'Hive B',
        apiaryId: 'apiary-b',
        apiary: { name: 'Apiary B' },
      },
      movements: [],
    };

    const makeService = () => {
      const tx = {
        queen: { findFirst: vi.fn(), update: vi.fn() },
        hive: { findFirst: vi.fn() },
        queenMovement: { create: vi.fn() },
      };
      const prisma = {
        $transaction: vi.fn(async (cb: (t: typeof tx) => Promise<void>) =>
          cb(tx),
        ),
        queen: {
          findFirst: vi.fn().mockResolvedValue(queenRow),
          findMany: vi.fn().mockResolvedValue([]),
        },
      };
      const prometheus = { incrementQueensCreated: vi.fn() };
      const svc = new QueensService(
        prisma as unknown as ConstructorParameters<typeof QueensService>[0],
        prometheus as unknown as ConstructorParameters<typeof QueensService>[1],
      );
      return { svc, tx, prisma };
    };

    it('moves a queen to a hive in another apiary the user can write to', async () => {
      const { svc, tx } = makeService();
      // 1st call: the queen (source, write scope); 2nd: active queen in target
      tx.queen.findFirst
        .mockResolvedValueOnce({ id: 'q1', hiveId: 'hive-a' })
        .mockResolvedValueOnce(null);
      tx.hive.findFirst.mockResolvedValue({ id: 'hive-b' });

      const result = await svc.recordTransfer(
        'q1',
        { toHiveId: 'hive-b' },
        filter,
      );

      // The target is checked against the user's writable apiaries, not the
      // selected apiary from the header.
      expect(tx.hive.findFirst).toHaveBeenCalledWith({
        where: { id: 'hive-b', apiary: apiaryWriteAccessWhere('user-1') },
      });
      expect(tx.queenMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            queenId: 'q1',
            fromHiveId: 'hive-a',
            toHiveId: 'hive-b',
          }),
        }),
      );
      expect(tx.queen.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'q1' },
          data: expect.objectContaining({ hiveId: 'hive-b', status: 'ACTIVE' }),
        }),
      );
      expect(result.hiveId).toBe('hive-b');
      expect(result.apiaryId).toBe('apiary-b');
      expect(result.apiaryName).toBe('Apiary B');
    });

    it('rejects a target hive in an apiary the user cannot write to', async () => {
      const { svc, tx } = makeService();
      tx.queen.findFirst.mockResolvedValueOnce({ id: 'q1', hiveId: 'hive-a' });
      tx.hive.findFirst.mockResolvedValue(null);

      await expect(
        svc.recordTransfer('q1', { toHiveId: 'hive-c' }, filter),
      ).rejects.toThrow(NotFoundException);
      expect(tx.queenMovement.create).not.toHaveBeenCalled();
      expect(tx.queen.update).not.toHaveBeenCalled();
    });

    it('rejects a queen whose apiary the user cannot write to', async () => {
      const { svc, tx } = makeService();
      tx.queen.findFirst.mockResolvedValueOnce(null);

      await expect(
        svc.recordTransfer('q1', { toHiveId: 'hive-b' }, filter),
      ).rejects.toThrow(NotFoundException);
      expect(tx.hive.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const filter = { userId: 'user-1' };
    const existing = { id: 'q2', hiveId: 'hive-a', motherQueenId: null };

    const makeService = () => {
      const prisma = {
        $queryRaw: vi.fn().mockResolvedValue([]),
        queen: {
          findFirst: vi.fn(),
          update: vi.fn().mockResolvedValue({
            ...existing,
            name: null,
            marking: null,
            color: null,
            year: 2025,
            source: null,
            status: 'ACTIVE',
            installedAt: null,
            replacedAt: null,
            notes: null,
            breeder: null,
            line: null,
            matingType: null,
            matingStation: null,
            matedAt: null,
            gentleness: null,
            hygiene: null,
            swarmResistance: null,
            honeyProduction: null,
            hive: null,
          }),
        },
      };
      const svc = new QueensService(
        prisma as unknown as ConstructorParameters<typeof QueensService>[0],
        {} as ConstructorParameters<typeof QueensService>[1],
      );
      return { svc, prisma };
    };

    it('leaves dates alone when they are not in the payload', async () => {
      const { svc, prisma } = makeService();
      prisma.queen.findFirst.mockResolvedValueOnce(existing);

      await svc.update('q2', { name: 'Bella' }, filter);

      const { data } = prisma.queen.update.mock.calls[0][0];
      expect(data.replacedAt).toBeUndefined();
      expect(data.installedAt).toBeUndefined();
      expect(data.matedAt).toBeUndefined();
    });

    it('clears a date sent as null', async () => {
      const { svc, prisma } = makeService();
      prisma.queen.findFirst.mockResolvedValueOnce(existing);

      await svc.update('q2', { replacedAt: null }, filter);

      expect(prisma.queen.update.mock.calls[0][0].data.replacedAt).toBeNull();
    });

    it('rejects the queen as her own mother', async () => {
      const { svc, prisma } = makeService();
      prisma.queen.findFirst.mockResolvedValueOnce(existing);

      await expect(
        svc.update('q2', { motherQueenId: 'q2' }, filter),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.queen.update).not.toHaveBeenCalled();
    });

    it('rejects a mother the user cannot see', async () => {
      const { svc, prisma } = makeService();
      prisma.queen.findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(null);

      await expect(
        svc.update('q2', { motherQueenId: 'q9' }, filter),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a daughter as the mother (lineage cycle)', async () => {
      const { svc, prisma } = makeService();
      // q2 -> mother q3, whose mother is q2
      prisma.queen.findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ id: 'q3' });
      prisma.$queryRaw.mockResolvedValueOnce([{ found: 1 }]);

      await expect(
        svc.update('q2', { motherQueenId: 'q3' }, filter),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.queen.update).not.toHaveBeenCalled();
    });

    it('accepts a mother from an unrelated line', async () => {
      const { svc, prisma } = makeService();
      prisma.queen.findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ id: 'q3' });

      await svc.update('q2', { motherQueenId: 'q3' }, filter);

      expect(prisma.queen.update.mock.calls[0][0].data.motherQueenId).toBe(
        'q3',
      );
    });
  });
});
