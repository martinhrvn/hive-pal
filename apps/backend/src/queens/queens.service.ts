import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrometheusService } from '../health/prometheus/prometheus.service';
import {
  ApiaryUserFilter,
  ApiaryScopeFilter,
} from '../interface/request-with.apiary';
import { apiaryAccessWhere } from '../common';
import {
  CreateQueen,
  QueenResponse,
  UpdateQueen,
  RecordQueenTransfer,
  QueenDetail,
} from 'shared-schemas';

@Injectable()
export class QueensService {
  constructor(
    private prisma: PrismaService,
    private prometheus: PrometheusService,
  ) {}

  private mapQueenToResponse(queen: {
    id: string;
    hiveId: string | null;
    name: string | null;
    marking: string | null;
    color: string | null;
    year: number | null;
    source: string | null;
    status: string;
    installedAt: Date | null;
    replacedAt: Date | null;
    hive?: { name: string } | null;
  }): QueenResponse {
    return {
      id: queen.id,
      hiveId: queen.hiveId,
      name: queen.name,
      hiveName: queen.hive?.name ?? null,
      marking: queen.marking,
      color: queen.color,
      year: queen.year,
      source: queen.source,
      status: queen.status as QueenResponse['status'],
      installedAt: queen.installedAt?.toISOString() ?? null,
      replacedAt: queen.replacedAt?.toISOString() ?? null,
    };
  }

  async create(
    createQueenDto: CreateQueen,
    filter: ApiaryUserFilter,
  ): Promise<QueenResponse> {
    if (createQueenDto.hiveId) {
      const hive = await this.prisma.hive.findFirst({
        where: { id: createQueenDto.hiveId, apiary: { id: filter.apiaryId } },
      });
      if (!hive) {
        throw new NotFoundException(
          `Hive with ID ${createQueenDto.hiveId} not found or does not belong to this apiary`,
        );
      }
      if (createQueenDto.status === 'ACTIVE') {
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
      },
      include: { hive: { select: { name: true } } },
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
    // Single apiary, or every apiary the user can access in view-all mode.
    const apiaryWhere = filter.apiaryId
      ? { id: filter.apiaryId }
      : apiaryAccessWhere(filter.userId);
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
      include: { hive: { select: { name: true } } },
    });
    return queens.map((queen) => this.mapQueenToResponse(queen));
  }

  async findOne(id: string, filter: ApiaryScopeFilter): Promise<QueenResponse> {
    const queen = await this.prisma.queen.findFirst({
      where: {
        id,
        hive: {
          apiary: filter.apiaryId
            ? { id: filter.apiaryId }
            : apiaryAccessWhere(filter.userId),
        },
      },
      include: { hive: { select: { name: true } } },
    });
    if (!queen) throw new NotFoundException(`Queen with ID ${id} not found`);
    return this.mapQueenToResponse(queen);
  }

  async update(
    id: string,
    updateQueenDto: UpdateQueen,
    filter: ApiaryUserFilter,
  ): Promise<QueenResponse> {
    const existingQueen = await this.prisma.queen.findFirst({
      where: { id, hive: { apiary: { id: filter.apiaryId } } },
    });
    if (!existingQueen)
      throw new NotFoundException(`Queen with ID ${id} not found`);

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
        installedAt: updateQueenDto.installedAt
          ? new Date(updateQueenDto.installedAt)
          : undefined,
        replacedAt: updateQueenDto.replacedAt
          ? new Date(updateQueenDto.replacedAt)
          : null,
      },
      include: { hive: { select: { name: true } } },
    });
    return this.mapQueenToResponse(updatedQueen);
  }

  async remove(id: string, filter: ApiaryUserFilter) {
    const existingQueen = await this.prisma.queen.findFirst({
      where: { id, hive: { apiary: { id: filter.apiaryId } } },
    });
    if (!existingQueen)
      throw new NotFoundException(`Queen with ID ${id} not found`);
    return this.prisma.queen.delete({ where: { id } });
  }

  async recordTransfer(
    queenId: string,
    dto: RecordQueenTransfer,
    filter: ApiaryUserFilter,
  ): Promise<QueenDetail> {
    const movedAt = dto.movedAt ? new Date(dto.movedAt) : new Date();

    await this.prisma.$transaction(async (tx) => {
      // Find queen directly — it may have hiveId=null if previously removed from a hive
      const queen = await tx.queen.findUnique({ where: { id: queenId } });
      if (!queen)
        throw new NotFoundException(`Queen with ID ${queenId} not found`);

      // Verify ownership: either queen is in a hive belonging to this user, or has
      // movement history tied to this user's apiary (covers the hiveId=null case).
      if (queen.hiveId) {
        const queenHive = await tx.hive.findFirst({
          where: { id: queen.hiveId, apiary: { id: filter.apiaryId } },
        });
        if (!queenHive)
          throw new NotFoundException(`Queen with ID ${queenId} not found`);
      } else {
        const ownedMovement = await tx.queenMovement.findFirst({
          where: {
            queenId,
            OR: [
              { fromHive: { apiary: { id: filter.apiaryId } } },
              { toHive: { apiary: { id: filter.apiaryId } } },
            ],
          },
        });
        if (!ownedMovement)
          throw new NotFoundException(`Queen with ID ${queenId} not found`);
      }

      if (dto.toHiveId) {
        const targetHive = await tx.hive.findFirst({
          where: { id: dto.toHiveId, apiary: { id: filter.apiaryId } },
        });
        if (!targetHive) {
          throw new NotFoundException(
            `Target hive with ID ${dto.toHiveId} not found or does not belong to this apiary`,
          );
        }
        const activeQueenInTarget = await tx.queen.findFirst({
          where: { hiveId: dto.toHiveId, status: 'ACTIVE' },
        });
        if (activeQueenInTarget && activeQueenInTarget.id !== queenId) {
          await tx.queen.update({
            where: { id: activeQueenInTarget.id },
            data: { status: 'REPLACED', replacedAt: movedAt },
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
        await tx.queen.update({
          where: { id: queenId },
          data: {
            hiveId: dto.toHiveId,
            installedAt: movedAt,
            status: 'ACTIVE',
          },
        });
      } else {
        await tx.queen.update({
          where: { id: queenId },
          data: { hiveId: null },
        });
      }
    });

    return this.getQueenHistory(queenId, filter);
  }

  async getQueenHistory(
    queenId: string,
    filter: ApiaryScopeFilter,
  ): Promise<QueenDetail> {
    const apiaryWhere = filter.apiaryId
      ? { id: filter.apiaryId }
      : apiaryAccessWhere(filter.userId);
    const queen = await this.prisma.queen.findFirst({
      where: {
        id: queenId,
        OR: [
          { hive: { apiary: apiaryWhere } },
          {
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
      },
      include: {
        hive: { select: { name: true } },
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

    return {
      id: queen.id,
      hiveId: queen.hiveId,
      name: queen.name,
      hiveName: queen.hive?.name ?? null,
      marking: queen.marking,
      color: queen.color,
      year: queen.year,
      source: queen.source,
      status: queen.status as QueenResponse['status'],
      installedAt: queen.installedAt?.toISOString() ?? null,
      replacedAt: queen.replacedAt?.toISOString() ?? null,
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
      where: {
        id: hiveId,
        apiary: filter.apiaryId
          ? { id: filter.apiaryId }
          : apiaryAccessWhere(filter.userId),
      },
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
        hive: { select: { name: true } },
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
    return this.prisma.queen.findFirst({ where: { hiveId, status: 'ACTIVE' } });
  }

  async markAllActiveQueensAsReplaced(hiveId: string) {
    return this.prisma.queen.updateMany({
      where: { hiveId, status: 'ACTIVE' },
      data: { status: 'REPLACED', replacedAt: new Date() },
    });
  }
}
