import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@/prisma/client';
import { ActionType, SplitHive, SplitHiveResponse } from 'shared-schemas';
import { PrismaService } from '../prisma/prisma.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';

const DEFAULT_FOLLOW_UP_DAYS = 24;
// Exported so the actions service can shift the reminder when a split is
// re-dated from the timeline.
export const SPLIT_FOLLOWUP_TITLE = 'Check requeening after split';

type SplitActionInput = {
  hiveId: string;
  date: Date;
  splitId: string;
  role: 'SOURCE' | 'NEW';
  counterpartHiveId: string;
  framesMoved: number;
  queenDisposition: SplitHive['queenDisposition'];
  notes?: string;
  userId?: string;
};

/**
 * Colony split (Volksteilung / Ableger). See docs/research/colony-split.
 * v1: move X brood frames from a source hive into a NEW hive, in one transaction.
 */
@Injectable()
export class SplitService {
  constructor(private prisma: PrismaService) {}

  private async createSplitAction(
    tx: Prisma.TransactionClient,
    p: SplitActionInput,
  ): Promise<void> {
    const action = await tx.action.create({
      data: {
        hiveId: p.hiveId,
        type: ActionType.SPLIT,
        date: p.date,
        notes: p.notes,
        ...(p.userId && { createdByUserId: p.userId }),
      },
    });
    await tx.splitAction.create({
      data: {
        actionId: action.id,
        splitId: p.splitId,
        role: p.role,
        counterpartHiveId: p.counterpartHiveId,
        framesMoved: p.framesMoved,
        queenDisposition: p.queenDisposition,
      },
    });
  }

  async split(
    sourceHiveId: string,
    dto: SplitHive,
    filter: ApiaryUserFilter,
  ): Promise<SplitHiveResponse> {
    const date = new Date(dto.date);
    const followUpDays = dto.followUpDays ?? DEFAULT_FOLLOW_UP_DAYS;

    return this.prisma.$transaction(async (tx) => {
      // 1. Load + verify the source hive (owned by this user).
      const source = await tx.hive.findFirst({
        where: {
          id: sourceHiveId,
          apiary: { id: filter.apiaryId, userId: filter.userId },
        },
        include: { boxes: true },
      });
      if (!source) {
        throw new NotFoundException('Source hive not found or access denied');
      }
      if (!source.apiaryId) {
        throw new BadRequestException('Source hive has no apiary');
      }

      // 2. Validate the frames to move: brood boxes of the source, within stock.
      const boxById = new Map(source.boxes.map((b) => [b.id, b]));
      let totalFrames = 0;
      for (const fm of dto.framesMoved) {
        const box = boxById.get(fm.boxId);
        if (!box) {
          throw new BadRequestException(
            `Box ${fm.boxId} does not belong to the source hive`,
          );
        }
        if (box.type !== 'BROOD') {
          throw new BadRequestException(
            'Frames can only be moved from brood boxes',
          );
        }
        if (fm.count > box.frameCount) {
          throw new BadRequestException(
            `Cannot move ${fm.count} frames from a box that has ${box.frameCount}`,
          );
        }
        totalFrames += fm.count;
      }

      // 3. Template the daughter's brood box from the source's main brood box.
      const mainBrood = source.boxes
        .filter((b) => b.type === 'BROOD')
        .sort((a, b) => a.position - b.position)[0];
      const apiaryId = dto.apiaryId ?? source.apiaryId;

      // The daughter may be placed at a different apiary — but only one the
      // caller actually owns.
      if (apiaryId !== source.apiaryId) {
        const target = await tx.apiary.findFirst({
          where: { id: apiaryId, userId: filter.userId },
          select: { id: true },
        });
        if (!target) {
          throw new NotFoundException(
            'Target apiary not found or access denied',
          );
        }
      }

      // 4. Create the daughter hive + one brood box holding the moved frames.
      const daughter = await tx.hive.create({
        data: {
          name: dto.newHiveName,
          apiaryId,
          status: 'ACTIVE',
          // The daughter colony comes into existence at the split.
          installationDate: date,
          parentHiveId: source.id,
          ...(source.settings != null
            ? { settings: source.settings as Prisma.InputJsonValue }
            : {}),
          boxes: {
            create: [
              {
                position: 0,
                frameCount: totalFrames,
                maxFrameCount: mainBrood?.maxFrameCount ?? 10,
                hasExcluder: false,
                type: 'BROOD',
                variant: mainBrood?.variant ?? undefined,
                frameSizeId: mainBrood?.frameSizeId ?? null,
              },
            ],
          },
        },
      });

      // 5. Debit the source brood box(es).
      for (const fm of dto.framesMoved) {
        await tx.box.update({
          where: { id: fm.boxId },
          data: { frameCount: { decrement: fm.count } },
        });
      }

      // 6. Queen disposition. Default: daughter starts queenless.
      let queenlessHiveId = daughter.id;
      if (dto.queenDisposition === 'MOVED_TO_NEW') {
        const queen = dto.queenId
          ? await tx.queen.findFirst({
              where: { id: dto.queenId, hiveId: source.id },
            })
          : await tx.queen.findFirst({
              where: { hiveId: source.id, status: 'ACTIVE' },
            });
        if (!queen) {
          throw new BadRequestException(
            'No active queen found in the source hive to move to the new hive',
          );
        }
        await tx.queenMovement.create({
          data: {
            queenId: queen.id,
            fromHiveId: source.id,
            toHiveId: daughter.id,
            movedAt: date,
            reason: 'Colony split',
          },
        });
        await tx.queen.update({
          where: { id: queen.id },
          data: { hiveId: daughter.id, installedAt: date, status: 'ACTIVE' },
        });
        queenlessHiveId = source.id; // the mother is now queenless
      }

      // 7. Write the matched SPLIT action pair.
      const splitId = randomUUID();
      await this.createSplitAction(tx, {
        hiveId: source.id,
        date,
        splitId,
        role: 'SOURCE',
        counterpartHiveId: daughter.id,
        framesMoved: totalFrames,
        queenDisposition: dto.queenDisposition,
        notes: dto.notes,
        userId: filter.userId,
      });
      await this.createSplitAction(tx, {
        hiveId: daughter.id,
        date,
        splitId,
        role: 'NEW',
        counterpartHiveId: source.id,
        framesMoved: totalFrames,
        queenDisposition: dto.queenDisposition,
        notes: dto.notes,
        userId: filter.userId,
      });

      // 8. Follow-up reminder for the queenless side.
      if (followUpDays > 0) {
        const dueDate = new Date(date.getTime() + followUpDays * 86_400_000);
        await tx.todo.create({
          data: {
            title: SPLIT_FOLLOWUP_TITLE,
            description:
              'Verify the queenless colony from the split is raising or has accepted a queen.',
            dueDate,
            apiaryId,
            hiveId: queenlessHiveId,
          },
        });
      }

      return {
        splitId,
        sourceHiveId: source.id,
        newHiveId: daughter.id,
      };
    });
  }

  /**
   * Undo a split: restore the mother's frames, revert the queen move, remove the
   * follow-up reminder, delete the SPLIT action pair, and delete the daughter
   * hive. Only allowed when the daughter has no records of its own, unless
   * `force` is set.
   */
  async undo(
    sourceHiveId: string,
    splitId: string,
    filter: ApiaryUserFilter,
    force = false,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const actions = await tx.action.findMany({
        where: { type: ActionType.SPLIT, splitAction: { splitId } },
        include: { splitAction: true },
      });
      const sourceAction = actions.find(
        (a) => a.splitAction?.role === 'SOURCE',
      );
      const newAction = actions.find((a) => a.splitAction?.role === 'NEW');
      if (
        !sourceAction?.splitAction ||
        !newAction?.hiveId ||
        !sourceAction.hiveId
      ) {
        throw new NotFoundException('Split not found');
      }
      if (sourceAction.hiveId !== sourceHiveId) {
        throw new BadRequestException('Split does not belong to this hive');
      }

      // Ownership: the source hive must belong to this user.
      const owned = await tx.hive.findFirst({
        where: { id: sourceHiveId, apiary: { userId: filter.userId } },
      });
      if (!owned) {
        throw new NotFoundException('Split not found or access denied');
      }

      const newHiveId = newAction.hiveId;
      const framesMoved = sourceAction.splitAction.framesMoved;
      const queenDisposition = sourceAction.splitAction.queenDisposition;

      // Guardrail: block if the daughter already has its own records.
      const [otherActions, inspections] = await Promise.all([
        tx.action.count({
          where: { hiveId: newHiveId, NOT: { type: ActionType.SPLIT } },
        }),
        tx.inspection.count({ where: { hiveId: newHiveId } }),
      ]);
      if ((otherActions > 0 || inspections > 0) && !force) {
        throw new ConflictException(
          'The new hive already has records; pass force=true to undo anyway.',
        );
      }

      // Revert a queen that was moved to the daughter.
      if (queenDisposition === 'MOVED_TO_NEW') {
        const queen = await tx.queen.findFirst({
          where: { hiveId: newHiveId, status: 'ACTIVE' },
        });
        if (queen) {
          await tx.queenMovement.create({
            data: {
              queenId: queen.id,
              fromHiveId: newHiveId,
              toHiveId: sourceHiveId,
              movedAt: new Date(sourceAction.date),
              reason: 'Undo colony split',
            },
          });
          await tx.queen.update({
            where: { id: queen.id },
            data: { hiveId: sourceHiveId, status: 'ACTIVE' },
          });
        }
      }

      // Restore the moved frames to the source's main brood box.
      const sourceBrood = await tx.box.findFirst({
        where: { hiveId: sourceHiveId, type: 'BROOD' },
        orderBy: { position: 'asc' },
      });
      if (sourceBrood) {
        await tx.box.update({
          where: { id: sourceBrood.id },
          data: { frameCount: { increment: framesMoved } },
        });
      }

      // Remove the follow-up reminder created for the queenless side.
      const queenlessHiveId =
        queenDisposition === 'MOVED_TO_NEW' ? sourceHiveId : newHiveId;
      await tx.todo.deleteMany({
        where: {
          hiveId: queenlessHiveId,
          title: SPLIT_FOLLOWUP_TITLE,
          completed: false,
        },
      });

      // Delete the SPLIT action pair, then the daughter hive (cascades its
      // boxes and its own — already removed — split action).
      await tx.splitAction.deleteMany({ where: { splitId } });
      await tx.action.deleteMany({
        where: { id: { in: [sourceAction.id, newAction.id] } },
      });
      await tx.hive.delete({ where: { id: newHiveId } });
    });
  }
}
