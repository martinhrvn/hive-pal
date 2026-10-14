import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { PrometheusService } from '../health/prometheus/prometheus.service';
import { Prisma } from '@/prisma/client';
import { ApiaryScopeFilter } from '../interface/request-with.apiary';
import { apiaryReadScope, apiaryWriteScope } from '../common';
import { HiveUpdatedEvent } from '../events/hive.events';
import {
  CURRENT_QUEEN_STATUSES,
  CreateQueen,
  QueenResponse,
  UpdateQueen,
  RecordQueenTransfer,
  QueenDetail,
  isCurrentQueenStatus,
  queenStatusOnInstall,
} from 'shared-schemas';

const queenInclude = {
  hive: {
    select: {
      name: true,
      apiaryId: true,
      apiary: { select: { name: true } },
    },
  },
} satisfies Prisma.QueenInclude;

const queenRefSelect = {
  id: true,
  name: true,
  year: true,
  color: true,
  status: true,
} satisfies Prisma.QueenSelect;

type QueenWithHive = Prisma.QueenGetPayload<{ include: typeof queenInclude }>;

// Guard against runaway walks through corrupt lineage data
const MAX_LINEAGE_DEPTH = 100;

/** Date fields: absent leaves the value alone, null clears it. */
const toOptionalDate = (value: string | Date | null | undefined) => {
  if (value === undefined) return undefined;
  return value === null ? null : new Date(value);
};

@Injectable()
export class QueensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prometheus: PrometheusService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private mapQueenToResponse(queen: QueenWithHive): QueenResponse {
    return {
      id: queen.id,
      hiveId: queen.hiveId,
      name: queen.name,
      hiveName: queen.hive?.name ?? null,
      apiaryId: queen.hive?.apiaryId ?? null,
      apiaryName: queen.hive?.apiary?.name ?? null,
      marking: queen.marking,
      color: queen.color,
      year: queen.year,
      source: queen.source,
      status: queen.status,
      installedAt: queen.installedAt?.toISOString() ?? null,
      replacedAt: queen.replacedAt?.toISOString() ?? null,
      statusChangedAt: queen.statusChangedAt.toISOString(),
      cellCappedAt: queen.cellCappedAt?.toISOString() ?? null,
      emergedAt: queen.emergedAt?.toISOString() ?? null,
      notes: queen.notes,
      breeder: queen.breeder,
      line: queen.line,
      motherQueenId: queen.motherQueenId,
      matingType: queen.matingType,
      matingStation: queen.matingStation,
      matedAt: queen.matedAt?.toISOString() ?? null,
      gentleness: queen.gentleness,
      hygiene: queen.hygiene,
      swarmResistance: queen.swarmResistance,
      honeyProduction: queen.honeyProduction,
    };
  }

  /** Breeding/mating/trait columns shared by create and update. */
  private profileData(dto: UpdateQueen) {
    return {
      notes: dto.notes,
      breeder: dto.breeder,
      line: dto.line,
      matingType: dto.matingType,
      matingStation: dto.matingStation,
      matedAt: toOptionalDate(dto.matedAt),
      cellCappedAt: toOptionalDate(dto.cellCappedAt),
      emergedAt: toOptionalDate(dto.emergedAt),
      gentleness: dto.gentleness,
      hygiene: dto.hygiene,
      swarmResistance: dto.swarmResistance,
      honeyProduction: dto.honeyProduction,
    };
  }

  /**
   * A mother must be a queen the user can see in any of their apiaries, must
   * not be the queen itself, and must not be one of its descendants.
   */
  private async assertValidMother(
    motherQueenId: string,
    queenId: string | null,
    filter: ApiaryScopeFilter,
  ) {
    if (motherQueenId === queenId) {
      throw new BadRequestException('A queen cannot be her own mother');
    }
    const mother = await this.prisma.queen.findFirst({
      where: {
        id: motherQueenId,
        ...this.queenScopeWhere({ userId: filter.userId }, 'read'),
      },
      select: { id: true },
    });
    if (!mother) {
      throw new BadRequestException(
        `Mother queen with ID ${motherQueenId} not found`,
      );
    }
    if (!queenId) return;

    // Walk up from the new mother; reaching this queen means a cycle.
    const [cycle] = await this.prisma.$queryRaw<{ found: number }[]>`
      WITH RECURSIVE ancestors AS (
        SELECT "id", "motherQueenId", 1 AS depth
        FROM "Queen" WHERE "id" = ${motherQueenId}
        UNION ALL
        SELECT q."id", q."motherQueenId", a.depth + 1
        FROM "Queen" q JOIN ancestors a ON q."id" = a."motherQueenId"
        WHERE a.depth < ${MAX_LINEAGE_DEPTH}
      )
      SELECT 1 AS found FROM ancestors WHERE "id" = ${queenId} LIMIT 1
    `;
    if (cycle) {
      throw new BadRequestException(
        'A queen cannot descend from one of her daughters',
      );
    }
  }

  /**
   * Scope for a queen: its current hive's apiary, or (for a queen no longer in
   * a hive) an apiary it was moved from/to. Read scope honours the selected
   * apiary as a filter; write scope requires OWNER/EDITOR on the queen's
   * current apiary (or on a former one when the queen has no hive).
   */
  private queenScopeWhere(
    filter: ApiaryScopeFilter,
    mode: 'read' | 'write',
  ): Prisma.QueenWhereInput {
    const apiary =
      mode === 'write' ? apiaryWriteScope(filter) : apiaryReadScope(filter);
    const viaMovements: Prisma.QueenWhereInput = {
      movements: {
        some: {
          OR: [{ fromHive: { apiary } }, { toHive: { apiary } }],
        },
      },
    };
    return {
      OR: [
        { hive: { apiary } },
        mode === 'write' ? { hiveId: null, ...viaMovements } : viaMovements,
      ],
    };
  }

  private async assertWritableHive(hiveId: string, filter: ApiaryScopeFilter) {
    const hive = await this.prisma.hive.findFirst({
      where: { id: hiveId, apiary: apiaryWriteScope(filter) },
      select: { id: true },
    });
    if (!hive) {
      throw new NotFoundException(
        `Hive with ID ${hiveId} not found or you cannot edit its apiary`,
      );
    }
  }

  async create(
    createQueenDto: CreateQueen,
    filter: ApiaryScopeFilter,
  ): Promise<QueenResponse> {
    if (createQueenDto.motherQueenId) {
      await this.assertValidMother(createQueenDto.motherQueenId, null, filter);
    }
    if (createQueenDto.hiveId) {
      const hive = await this.prisma.hive.findFirst({
        where: { id: createQueenDto.hiveId, apiary: apiaryWriteScope(filter) },
      });
      if (!hive) {
        throw new NotFoundException(
          `Hive with ID ${createQueenDto.hiveId} not found or does not belong to this apiary`,
        );
      }
      if (isCurrentQueenStatus(createQueenDto.status)) {
        await this.markAllActiveQueensAsReplaced(createQueenDto.hiveId);
      }
    }

    const queen = await this.prisma.queen.create({
      data: {
        hiveId: createQueenDto.hiveId,
        name: createQueenDto.name,
        marking: createQueenDto.marking,
        color: createQueenDto.color,
        year: createQueenDto.year,
        source: createQueenDto.source,
        status: createQueenDto.status ?? 'ACTIVE',
        installedAt: createQueenDto.installedAt
          ? new Date(createQueenDto.installedAt)
          : null,
        replacedAt: createQueenDto.replacedAt
          ? new Date(createQueenDto.replacedAt)
          : null,
        motherQueenId: createQueenDto.motherQueenId,
        ...this.profileData(createQueenDto),
      },
      include: queenInclude,
    });

    if (createQueenDto.hiveId) {
      await this.prisma.queenMovement.create({
        data: {
          queenId: queen.id,
          fromHiveId: null,
          toHiveId: createQueenDto.hiveId,
          movedAt: queen.installedAt ?? new Date(),
          reason: 'Initial installation',
        },
      });
    }

    this.prometheus.incrementQueensCreated();
    return this.mapQueenToResponse(queen);
  }

  async findAll(
    filter: ApiaryScopeFilter,
    params?: { status?: string; hiveId?: string },
  ): Promise<QueenResponse[]> {
    // Selected apiary as a filter, or every apiary the user can access.
    const apiaryWhere = apiaryReadScope(filter);
    const apiaryFilter = { hive: { apiary: apiaryWhere } };

    let where: Record<string, unknown>;
    if (params?.hiveId) {
      where = { ...apiaryFilter, hiveId: params.hiveId };
    } else {
      // Include queens currently in this user's hives, and queens removed from a hive
      // (hiveId=null) that still have movement history tied to this user's apiaries.
      where = {
        OR: [
          apiaryFilter,
          {
            hiveId: null,
            movements: {
              some: {
                OR: [
                  { fromHive: { apiary: apiaryWhere } },
                  { toHive: { apiary: apiaryWhere } },
                ],
              },
            },
          },
        ],
      };
    }

    if (params?.status) {
      where = { AND: [where, { status: params.status }] };
    }

    const queens = await this.prisma.queen.findMany({
      where,
      include: queenInclude,
    });
    return queens.map((queen) => this.mapQueenToResponse(queen));
  }

  async findOne(id: string, filter: ApiaryScopeFilter): Promise<QueenResponse> {
    const queen = await this.prisma.queen.findFirst({
      where: { id, ...this.queenScopeWhere(filter, 'read') },
      include: queenInclude,
    });
    if (!queen) throw new NotFoundException(`Queen with ID ${id} not found`);
    return this.mapQueenToResponse(queen);
  }

  async update(
    id: string,
    updateQueenDto: UpdateQueen,
    filter: ApiaryScopeFilter,
  ): Promise<QueenResponse> {
    const existingQueen = await this.prisma.queen.findFirst({
      where: { id, ...this.queenScopeWhere(filter, 'write') },
    });
    if (!existingQueen)
      throw new NotFoundException(`Queen with ID ${id} not found`);

    // Re-parenting the queen requires write access to the target hive's apiary.
    if (
      updateQueenDto.hiveId &&
      updateQueenDto.hiveId !== existingQueen.hiveId
    ) {
      await this.assertWritableHive(updateQueenDto.hiveId, filter);
    }
    if (updateQueenDto.motherQueenId) {
      await this.assertValidMother(updateQueenDto.motherQueenId, id, filter);
    }

    const statusChanged =
      !!updateQueenDto.status && updateQueenDto.status !== existingQueen.status;

    const updatedQueen = await this.prisma.queen.update({
      where: { id },
      data: {
        hiveId: updateQueenDto.hiveId,
        name: updateQueenDto.name,
        marking: updateQueenDto.marking,
        color: updateQueenDto.color,
        year: updateQueenDto.year,
        source: updateQueenDto.source,
        status: updateQueenDto.status ?? undefined,
        statusChangedAt: statusChanged ? new Date() : undefined,
        installedAt: toOptionalDate(updateQueenDto.installedAt),
        replacedAt: toOptionalDate(updateQueenDto.replacedAt),
        motherQueenId: updateQueenDto.motherQueenId,
        ...this.profileData(updateQueenDto),
      },
      include: queenInclude,
    });
    if (statusChanged && updatedQueen.hiveId && updatedQueen.hive) {
      this.notifyHiveChanged(
        updatedQueen.hiveId,
        updatedQueen.hive.apiaryId,
        filter.userId,
      );
    }
    return this.mapQueenToResponse(updatedQueen);
  }

  async remove(id: string, filter: ApiaryScopeFilter) {
    const existingQueen = await this.prisma.queen.findFirst({
      where: { id, ...this.queenScopeWhere(filter, 'write') },
    });
    if (!existingQueen)
      throw new NotFoundException(`Queen with ID ${id} not found`);
    return this.prisma.queen.delete({ where: { id } });
  }

  async recordTransfer(
    queenId: string,
    dto: RecordQueenTransfer,
    filter: ApiaryScopeFilter,
  ): Promise<QueenDetail> {
    const movedAt = dto.movedAt ? new Date(dto.movedAt) : new Date();
    // Hives whose current queen changed, to re-check their alerts afterwards
    const changedHives: { id: string; apiaryId: string | null }[] = [];

    await this.prisma.$transaction(async (tx) => {
      // The user must be able to write to the queen's current apiary (or, for a
      // queen no longer in a hive, to an apiary in its movement history). The
      // selected apiary is not a constraint: transfers may cross apiaries.
      const queen = await tx.queen.findFirst({
        where: { id: queenId, ...this.queenScopeWhere(filter, 'write') },
        include: { hive: { select: { apiaryId: true } } },
      });
      if (!queen)
        throw new NotFoundException(`Queen with ID ${queenId} not found`);
      if (queen.hive && queen.hiveId) {
        changedHives.push({ id: queen.hiveId, apiaryId: queen.hive.apiaryId });
      }

      if (dto.toHiveId) {
        // The target may be in any apiary the user can write to.
        const targetHive = await tx.hive.findFirst({
          where: { id: dto.toHiveId, apiary: apiaryWriteScope(filter) },
        });
        if (!targetHive) {
          throw new NotFoundException(
            `Target hive with ID ${dto.toHiveId} not found or you cannot edit its apiary`,
          );
        }
        changedHives.push({ id: targetHive.id, apiaryId: targetHive.apiaryId });
        const currentQueenInTarget = await tx.queen.findFirst({
          where: {
            hiveId: dto.toHiveId,
            status: { in: [...CURRENT_QUEEN_STATUSES] },
          },
        });
        if (currentQueenInTarget && currentQueenInTarget.id !== queenId) {
          await tx.queen.update({
            where: { id: currentQueenInTarget.id },
            data: {
              status: 'REPLACED',
              replacedAt: movedAt,
              statusChangedAt: movedAt,
            },
          });
        }
      }

      await tx.queenMovement.create({
        data: {
          queenId,
          fromHiveId: queen.hiveId,
          toHiveId: dto.toHiveId,
          movedAt,
          reason: dto.reason,
          notes: dto.notes,
        },
      });

      // Only update installedAt/status when moving TO a hive; removing from a hive
      // should not overwrite installedAt with the removal timestamp or keep status ACTIVE.
      if (dto.toHiveId) {
        const status = queenStatusOnInstall(queen.status);
        await tx.queen.update({
          where: { id: queenId },
          data: {
            hiveId: dto.toHiveId,
            installedAt: movedAt,
            status,
            statusChangedAt: status === queen.status ? undefined : movedAt,
          },
        });
      } else {
        await tx.queen.update({
          where: { id: queenId },
          data: { hiveId: null },
        });
      }
    });

    for (const hive of changedHives) {
      this.notifyHiveChanged(hive.id, hive.apiaryId, filter.userId);
    }

    return this.getQueenHistory(queenId, filter);
  }

  async getQueenHistory(
    queenId: string,
    filter: ApiaryScopeFilter,
  ): Promise<QueenDetail> {
    const queen = await this.prisma.queen.findFirst({
      where: { id: queenId, ...this.queenScopeWhere(filter, 'read') },
      include: {
        ...queenInclude,
        movements: {
          include: {
            fromHive: { select: { name: true } },
            toHive: { select: { name: true } },
          },
          orderBy: { movedAt: 'desc' },
        },
      },
    });

    if (!queen)
      throw new NotFoundException(`Queen with ID ${queenId} not found`);

    // Lineage may span apiaries; only show relatives the user can see.
    const relativesScope = this.queenScopeWhere(
      { userId: filter.userId },
      'read',
    );
    const [motherQueen, daughters] = await Promise.all([
      queen.motherQueenId
        ? this.prisma.queen.findFirst({
            where: { id: queen.motherQueenId, ...relativesScope },
            select: queenRefSelect,
          })
        : null,
      this.prisma.queen.findMany({
        where: { motherQueenId: queen.id, ...relativesScope },
        select: queenRefSelect,
        orderBy: [{ year: 'desc' }, { name: 'asc' }],
      }),
    ]);

    return {
      ...this.mapQueenToResponse(queen),
      motherQueen,
      daughters,
      movements: queen.movements.map((m) => ({
        id: m.id,
        queenId: m.queenId,
        fromHiveId: m.fromHiveId,
        fromHiveName: m.fromHive?.name ?? null,
        toHiveId: m.toHiveId,
        toHiveName: m.toHive?.name ?? null,
        movedAt: m.movedAt.toISOString(),
        reason: m.reason,
        notes: m.notes,
      })),
    };
  }

  async getHiveQueenHistory(
    hiveId: string,
    filter: ApiaryScopeFilter,
  ): Promise<QueenResponse[]> {
    const hive = await this.prisma.hive.findFirst({
      where: { id: hiveId, apiary: apiaryReadScope(filter) },
    });
    if (!hive) throw new NotFoundException(`Hive with ID ${hiveId} not found`);

    const queens = await this.prisma.queen.findMany({
      where: {
        OR: [
          { hiveId },
          {
            movements: {
              some: { OR: [{ toHiveId: hiveId }, { fromHiveId: hiveId }] },
            },
          },
        ],
      },
      include: {
        ...queenInclude,
        // Include only movements relevant to this hive for date derivation
        movements: {
          where: { OR: [{ toHiveId: hiveId }, { fromHiveId: hiveId }] },
          orderBy: { movedAt: 'desc' },
        },
      },
    });

    // Deduplicate (a queen currently in the hive AND with movements would appear twice)
    const seen = new Set<string>();
    const uniqueQueens = queens.filter((q) => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });

    // Sort by most recent movement involving this hive (descending)
    uniqueQueens.sort((a, b) => {
      const aDate =
        a.movements[0]?.movedAt?.getTime() ?? a.installedAt?.getTime() ?? 0;
      const bDate =
        b.movements[0]?.movedAt?.getTime() ?? b.installedAt?.getTime() ?? 0;
      return bDate - aDate;
    });

    return uniqueQueens.map((queen) => {
      // Derive hive-specific dates: when the queen moved INTO this hive and when they left
      const installedMovement = queen.movements.find(
        (m) => m.toHiveId === hiveId,
      );
      const leftMovement = queen.movements.find((m) => m.fromHiveId === hiveId);
      return {
        ...this.mapQueenToResponse(queen),
        installedAt:
          installedMovement?.movedAt.toISOString() ??
          queen.installedAt?.toISOString() ??
          null,
        replacedAt:
          leftMovement?.movedAt.toISOString() ??
          queen.replacedAt?.toISOString() ??
          null,
      };
    });
  }

  async findCurrentQueen(hiveId: string) {
    return this.prisma.queen.findFirst({
      where: { hiveId, status: { in: [...CURRENT_QUEEN_STATUSES] } },
    });
  }

  async markAllActiveQueensAsReplaced(hiveId: string) {
    const now = new Date();
    return this.prisma.queen.updateMany({
      where: { hiveId, status: { in: [...CURRENT_QUEEN_STATUSES] } },
      data: { status: 'REPLACED', replacedAt: now, statusChangedAt: now },
    });
  }

  /** Re-runs the hive's alert checks, e.g. the virgin queen reminder. */
  private notifyHiveChanged(
    hiveId: string,
    apiaryId: string | null,
    userId: string,
  ) {
    this.eventEmitter.emit(
      'hive.updated',
      new HiveUpdatedEvent(hiveId, apiaryId ?? '', userId, 'general'),
    );
  }
}
