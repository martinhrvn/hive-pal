import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { Prisma } from '@/prisma/client';
import {
  ActionType,
  CombineHives,
  CombineHivesResponse,
  CombineRole,
  CURRENT_QUEEN_STATUSES,
  HiveStatus,
  OtherQueenFate,
  QueenStatus,
} from 'shared-schemas';
import { PrismaService } from '../prisma/prisma.service';
import { ApiaryScopeFilter } from '../interface/request-with.apiary';
import { apiaryWriteScope } from '../common';
import { HiveUpdatedEvent } from '../events/hive.events';
import { installStatus } from './split.service';

/** Only living colonies can be united. */
const COMBINABLE_STATUSES: ReadonlySet<string> = new Set([
  HiveStatus.ACTIVE,
  HiveStatus.INACTIVE,
]);

type CombineActionInput = {
  hiveId: string;
  date: Date;
  combineId: string;
  role: CombineRole;
  counterpartHiveId: string;
  keptQueenId: string | null;
  otherQueenId: string | null;
  otherQueenFate: OtherQueenFate | null;
  boxesMoved: number;
  notes?: string;
  userId: string;
};

/**
 * Colony combine (uniting two colonies). The hive in the URL survives; the
 * absorbed hive is archived. One queen is kept (moved into the survivor if she
 * came from the absorbed hive), the other is marked DEAD or REPLACED, and the
 * absorbed hive's boxes are optionally stacked on top of the survivor. Both
 * hives get a COMBINE action sharing one combineId.
 */
@Injectable()
export class CombineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async createCombineAction(
    tx: Prisma.TransactionClient,
    p: CombineActionInput,
  ): Promise<void> {
    await tx.action.create({
      data: {
        hiveId: p.hiveId,
        type: ActionType.COMBINE,
        date: p.date,
        notes: p.notes,
        createdByUserId: p.userId,
        combineAction: {
          create: {
            combineId: p.combineId,
            role: p.role,
            counterpartHiveId: p.counterpartHiveId,
            keptQueenId: p.keptQueenId,
            otherQueenId: p.otherQueenId,
            otherQueenFate: p.otherQueenFate,
            boxesMoved: p.boxesMoved,
          },
        },
      },
    });
  }

  async combine(
    survivorHiveId: string,
    dto: CombineHives,
    filter: ApiaryScopeFilter,
  ): Promise<CombineHivesResponse> {
    if (dto.absorbedHiveId === survivorHiveId) {
      throw new BadRequestException('A hive cannot be combined with itself');
    }
    const date = new Date(dto.date);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Both hives must be writable by the caller and live in one apiary.
      const hives = await tx.hive.findMany({
        where: {
          id: { in: [survivorHiveId, dto.absorbedHiveId] },
          apiary: apiaryWriteScope(filter),
        },
        include: { boxes: { orderBy: { position: 'asc' } } },
      });
      const survivor = hives.find((h) => h.id === survivorHiveId);
      const absorbed = hives.find((h) => h.id === dto.absorbedHiveId);
      if (!survivor || !absorbed) {
        throw new NotFoundException('Hive not found or access denied');
      }
      if (survivor.apiaryId !== absorbed.apiaryId) {
        throw new BadRequestException(
          'Only hives in the same apiary can be combined',
        );
      }
      if (
        !COMBINABLE_STATUSES.has(survivor.status) ||
        !COMBINABLE_STATUSES.has(absorbed.status)
      ) {
        throw new BadRequestException(
          'Only active or inactive hives can be combined',
        );
      }

      // 2. Queens: keep one of the two current queens, retire the other.
      const currentQueens = await tx.queen.findMany({
        where: {
          hiveId: { in: [survivor.id, absorbed.id] },
          status: { in: [...CURRENT_QUEEN_STATUSES] },
        },
        orderBy: { installedAt: 'desc' },
      });
      const keptQueen = dto.keptQueenId
        ? currentQueens.find((q) => q.id === dto.keptQueenId)
        : undefined;
      if (dto.keptQueenId && !keptQueen) {
        throw new BadRequestException(
          'The kept queen must be a current queen of one of the two hives',
        );
      }
      // Every other current queen of either hive leaves the united colony.
      const otherQueens = currentQueens.filter((q) => q.id !== keptQueen?.id);

      if (keptQueen && keptQueen.hiveId === absorbed.id) {
        await tx.queenMovement.create({
          data: {
            queenId: keptQueen.id,
            fromHiveId: absorbed.id,
            toHiveId: survivor.id,
            movedAt: date,
            reason: 'Colony combine',
          },
        });
        await tx.queen.update({
          where: { id: keptQueen.id },
          data: {
            hiveId: survivor.id,
            installedAt: date,
            ...installStatus(keptQueen.status as QueenStatus, date),
          },
        });
      }
      if (otherQueens.length > 0) {
        await tx.queen.updateMany({
          where: { id: { in: otherQueens.map((q) => q.id) } },
          data: {
            status: dto.otherQueenFate,
            statusChangedAt: date,
            replacedAt: date,
          },
        });
      }

      // 3. Stack the absorbed hive's boxes on top of the survivor's.
      let boxesMoved = 0;
      if (dto.moveBoxes && absorbed.boxes.length > 0) {
        const top = survivor.boxes.reduce(
          (max, b) => Math.max(max, b.position),
          -1,
        );
        for (const [i, box] of absorbed.boxes.entries()) {
          await tx.box.update({
            where: { id: box.id },
            data: { hiveId: survivor.id, position: top + 1 + i },
          });
        }
        boxesMoved = absorbed.boxes.length;
      }

      // 4. The absorbed colony no longer exists on its own.
      await tx.hive.update({
        where: { id: absorbed.id },
        data: { status: HiveStatus.ARCHIVED },
      });

      // 5. The matched COMBINE action pair.
      const combineId = randomUUID();
      const shared = {
        date,
        combineId,
        keptQueenId: keptQueen?.id ?? null,
        // Normally at most one; record the first if data had several.
        otherQueenId: otherQueens[0]?.id ?? null,
        otherQueenFate: otherQueens.length > 0 ? dto.otherQueenFate : null,
        boxesMoved,
        notes: dto.notes,
        userId: filter.userId,
      };
      await this.createCombineAction(tx, {
        ...shared,
        hiveId: survivor.id,
        role: 'SURVIVOR',
        counterpartHiveId: absorbed.id,
      });
      await this.createCombineAction(tx, {
        ...shared,
        hiveId: absorbed.id,
        role: 'ABSORBED',
        counterpartHiveId: survivor.id,
      });

      return { combineId, apiaryId: survivor.apiaryId ?? '' };
    });

    // 6. Re-run alert checks for both hives.
    this.eventEmitter.emit(
      'hive.updated',
      new HiveUpdatedEvent(
        survivorHiveId,
        result.apiaryId,
        filter.userId,
        dto.moveBoxes ? 'boxes' : 'general',
      ),
    );
    this.eventEmitter.emit(
      'hive.updated',
      new HiveUpdatedEvent(
        dto.absorbedHiveId,
        result.apiaryId,
        filter.userId,
        'status',
      ),
    );

    return {
      combineId: result.combineId,
      survivorHiveId,
      absorbedHiveId: dto.absorbedHiveId,
    };
  }
}
