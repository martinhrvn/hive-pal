import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';
import { CreateQueen, QueenResponse, UpdateQueen } from 'shared-schemas';

@Injectable()
export class QueensService {
  constructor(private prisma: PrismaService) {}

  async create(
    createQueenDto: CreateQueen,
    filter: ApiaryUserFilter,
  ): Promise<QueenResponse> {
    // Check if the hive belongs to the user's apiary
    if (createQueenDto.hiveId) {
      const hive = await this.prisma.hive.findFirst({
        where: {
          id: createQueenDto.hiveId,
          apiary: {
            id: filter.apiaryId,
            userId: filter.userId,
          },
        },
      });

      if (!hive) {
        throw new NotFoundException(
          `Hive with ID ${createQueenDto.hiveId} not found or doesn't belong to this apiary`,
        );
      }

      if (createQueenDto.status === 'ACTIVE') {
        await this.markAllActiveQueensAsReplaced(createQueenDto.hiveId);
      }
    }

    const queen = await this.prisma.queen.create({
      data: {
        hiveId: createQueenDto.hiveId,
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
    });

    return {
      id: queen.id,
      hiveId: queen.hiveId,
      marking: createQueenDto.marking,
      color: queen.color,
      year: queen.year,
      source: queen.source,
      status: queen.status,
      installedAt: queen.installedAt?.toISOString(),
      replacedAt: queen.replacedAt?.toISOString() || null,
    };
  }

  async findAll(filter: ApiaryUserFilter): Promise<QueenResponse[]> {
    // Find all queens for hives in the specified apiary owned by this user
    const queens = await this.prisma.queen.findMany({
      where: {
        hive: {
          apiary: {
            id: filter.apiaryId,
            userId: filter.userId,
          },
        },
      },
    });

    return queens.map((queen) => ({
      id: queen.id,
      hiveId: queen.hiveId,
      marking: queen.marking,
      color: queen.color,
      year: queen.year,
      source: queen.source,
      status: queen.status,
      installedAt: queen.installedAt?.toISOString(),
      replacedAt: queen.replacedAt?.toISOString() || null,
    }));
  }

  async findOne(id: string, filter: ApiaryUserFilter): Promise<QueenResponse> {
    const queen = await this.prisma.queen.findFirst({
      where: {
        id,
        hive: {
          apiary: {
            id: filter.apiaryId,
            userId: filter.userId,
          },
        },
      },
    });

    if (!queen) {
      throw new NotFoundException(`Queen with ID ${id} not found`);
    }

    return {
      id: queen.id,
      hiveId: queen.hiveId,
      marking: queen.marking,
      color: queen.color,
      year: queen.year,
      source: queen.source,
      status: queen.status,
      installedAt: queen.installedAt?.toISOString(),
      replacedAt: queen.replacedAt?.toISOString() || null,
    };
  }

  async update(
    id: string,
    updateQueenDto: UpdateQueen,
    filter: ApiaryUserFilter,
  ): Promise<QueenResponse> {
    // Check if queen exists and belongs to the user's apiary
    const existingQueen = await this.prisma.queen.findFirst({
      where: {
        id,
        hive: {
          apiary: {
            id: filter.apiaryId,
            userId: filter.userId,
          },
        },
      },
    });

    if (!existingQueen) {
      throw new NotFoundException(`Queen with ID ${id} not found`);
    }

    // Update queen
    const updatedQueen = await this.prisma.queen.update({
      where: { id },
      data: {
        hiveId: updateQueenDto.hiveId,
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
    });

    return {
      id: updatedQueen.id,
      hiveId: updatedQueen.hiveId,
      marking: updatedQueen.marking,
      color: updatedQueen.color,
      year: updatedQueen.year,
      source: updatedQueen.source,
      status: updatedQueen.status,
      installedAt: updatedQueen.installedAt?.toISOString(),
      replacedAt: updatedQueen.replacedAt?.toISOString() || null,
    };
  }

  async remove(id: string, filter: ApiaryUserFilter) {
    // Check if queen exists and belongs to the user's apiary
    const existingQueen = await this.prisma.queen.findFirst({
      where: {
        id,
        hive: {
          apiary: {
            id: filter.apiaryId,
            userId: filter.userId,
          },
        },
      },
    });

    if (!existingQueen) {
      throw new NotFoundException(`Queen with ID ${id} not found`);
    }

    // Delete queen
    return this.prisma.queen.delete({
      where: { id },
    });
  }

  async findCurrentQueen(hiveId: string) {
    return this.prisma.queen.findFirst({
      where: {
        hiveId: hiveId,
        status: 'ACTIVE',
      },
    });
  }

  async markAllActiveQueensAsReplaced(hiveId: string) {
    return this.prisma.queen.updateMany({
      where: { hiveId, status: 'ACTIVE' },
      data: {
        status: 'REPLACED',
        replacedAt: new Date(),
      },
    });
  }
}
