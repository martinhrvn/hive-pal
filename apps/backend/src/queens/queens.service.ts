import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateQueenDto } from './dto/create-queen.dto';
import { UpdateQueenDto } from './dto/update-queen.dto';
import { PrismaService } from '../prisma/prisma.service';
import { QueenResponseDto, QueenStatus } from './dto/queen-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class QueensService {
  constructor(private prisma: PrismaService) {}

  async create(createQueenDto: CreateQueenDto): Promise<QueenResponseDto> {
    if (createQueenDto.hiveId && createQueenDto.status === QueenStatus.ACTIVE) {
      await this.markAllActiveQueensAsReplaced(createQueenDto.hiveId);
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

    return plainToInstance(QueenResponseDto, {
      id: queen.id,
      hiveId: queen.hiveId,
      marking: createQueenDto.marking,
      color: queen.color,
      year: queen.year,
      source: queen.source,
      status: queen.status,
      installedAt: queen.installedAt?.toISOString(),
      replacedAt: queen.replacedAt?.toISOString() || null,
    });
  }

  async findAll() {
    const queens = await this.prisma.queen.findMany();
    return queens.map((queen) =>
      plainToInstance(QueenResponseDto, {
        id: queen.id,
        hiveId: queen.hiveId,
        color: queen.color,
        year: queen.year,
        source: queen.source,
        status: queen.status,
        installedAt: queen.installedAt?.toISOString(),
        replacedAt: queen.replacedAt?.toISOString() || null,
      }),
    );
  }

  async findOne(id: string) {
    const queen = await this.prisma.queen.findUnique({
      where: { id },
    });

    if (!queen) {
      throw new NotFoundException(`Queen with ID ${id} not found`);
    }

    return plainToInstance(QueenResponseDto, {
      id: queen.id,
      hiveId: queen.hiveId,
      color: queen.color,
      year: queen.year,
      source: queen.source,
      status: queen.status,
      installedAt: queen.installedAt?.toISOString(),
      replacedAt: queen.replacedAt?.toISOString() || null,
    });
  }

  async update(id: string, updateQueenDto: UpdateQueenDto) {
    // Check if queen exists
    const existingQueen = await this.prisma.queen.findUnique({
      where: { id },
    });

    if (!existingQueen) {
      throw new NotFoundException(`Queen with ID ${id} not found`);
    }

    // Update queen
    const updatedQueen = await this.prisma.queen.update({
      where: { id },
      data: {
        hiveId: updateQueenDto.hiveId,
        color: updateQueenDto.color,
        year: updateQueenDto.year,
        source: updateQueenDto.source,
        status: updateQueenDto.status ?? 'ACTIVE',
        installedAt: updateQueenDto.installedAt
          ? new Date(updateQueenDto.installedAt)
          : undefined,
        replacedAt: updateQueenDto.replacedAt
          ? new Date(updateQueenDto.replacedAt)
          : null,
      },
    });

    return plainToInstance(QueenResponseDto, {
      id: updatedQueen.id,
      hiveId: updatedQueen.hiveId,
      marking: updateQueenDto.marking,
      color: updatedQueen.color,
      year: updatedQueen.year,
      source: updatedQueen.source,
      status: updatedQueen.status,
      installedAt: updatedQueen.installedAt?.toISOString(),
      replacedAt: updatedQueen.replacedAt?.toISOString() || null,
    });
  }

  async remove(id: string) {
    // Check if queen exists
    const existingQueen = await this.prisma.queen.findUnique({
      where: { id },
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
