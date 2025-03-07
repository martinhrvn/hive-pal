import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHiveDto } from './dto/create-hive.dto';
import { UpdateHiveDto } from './dto/update-hive.dto';
import { HiveResponseDto } from './dto/hive-response.dto';
import { HiveDetailResponseDto } from './dto/hive-detail-response.dto';
import { plainToInstance } from 'class-transformer';
import { mapPrismaHiveStatusToDto } from './dto/hive-status.enum';
import { BoxTypeDto, UpdateHiveBoxesDto } from './dto/update-hive-boxes.dto';
import { Box } from '@prisma/client';
import { BoxResponseDto } from './dto/box-response.dto';
@Injectable()
export class HiveService {
  constructor(private prisma: PrismaService) {}

  async create(createHiveDto: CreateHiveDto): Promise<HiveResponseDto> {
    const hive = await this.prisma.hive.create({
      data: createHiveDto,
    });
    return {
      id: hive.id,
      name: hive.name,
      apiaryId: hive.apiaryId,
      status: mapPrismaHiveStatusToDto(hive.status),
      notes: hive.notes,
      installationDate: hive.installationDate?.toISOString() ?? '',
      lastInspectionDate: null,
    };
  }

  async findAll(): Promise<HiveResponseDto[]> {
    const hives = await this.prisma.hive.findMany({
      include: {
        inspections: {
          select: {
            date: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 1,
        },
      },
    });

    return hives.map((hive) =>
      plainToInstance(HiveResponseDto, {
        id: hive.id,
        name: hive.name,
        apiaryId: hive.apiaryId,
        status: mapPrismaHiveStatusToDto(hive.status),
        notes: hive.notes,
        installationDate: hive.installationDate?.toISOString() ?? '',
        lastInspectionDate: hive.inspections[0]?.date?.toISOString() ?? '',
      }),
    );
  }

  async findOne(id: string) {
    const hive = await this.prisma.hive.findUnique({
      where: { id },
      include: {
        apiary: true,
        queens: {
          orderBy: {
            installedAt: 'desc',
          },
        },
        boxes: {
          orderBy: {
            position: 'asc',
          },
        },
        inspections: {
          orderBy: {
            date: 'desc',
          },
          include: {
            observations: true,
            actions: true,
          },
        },
      },
    });

    if (!hive) {
      return null;
    }

    return plainToInstance(HiveDetailResponseDto, {
      id: hive.id,
      name: hive.name,
      apiaryId: hive.apiaryId,
      status: mapPrismaHiveStatusToDto(hive.status),
      notes: hive.notes,
      installationDate:
        typeof hive.installationDate === 'string'
          ? hive.installationDate
          : (hive.installationDate?.toISOString() ?? null),
      lastInspectionDate:
        hive.inspections && hive.inspections.length > 0
          ? (hive.inspections[0].date?.toISOString() ?? null)
          : null,
      boxes: hive.boxes.map(
        (box): BoxResponseDto => ({
          id: box.id,
          position: box.position,
          frameCount: box.frameCount,
          maxFrameCount: box.maxFrameCount,
          hasExcluder: box.hasExcluder,
          type: box.type as BoxTypeDto,
        }),
      ),
    });
  }

  update(id: string, updateHiveDto: UpdateHiveDto) {
    return this.prisma.hive.update({
      where: { id },
      data: updateHiveDto,
    });
  }

  remove(id: string) {
    return this.prisma.hive.delete({
      where: { id },
    });
  }

  async updateBoxes(id: string, updateHiveBoxesDto: UpdateHiveBoxesDto) {
    // First check if the hive exists
    const hive = await this.prisma.hive.findUnique({
      where: { id },
    });

    if (!hive) {
      throw new NotFoundException(`Hive with id ${id} not found`);
    }

    // Use a transaction to ensure atomicity
    const updatedHive = await this.prisma.$transaction(async (tx) => {
      // First, delete all existing boxes for this hive
      await tx.box.deleteMany({
        where: { hiveId: id },
      });

      // Then create all the new boxes
      const boxPromises = updateHiveBoxesDto.boxes.map((box) => {
        return tx.box.create({
          data: {
            id: box.id, // If provided, will use this ID, otherwise Prisma will generate one
            hiveId: id,
            position: box.position,
            frameCount: box.frameCount,
            hasExcluder: box.hasExcluder,
            type: box.type, // BoxType enum matches our DTO enum
            maxFrameCount: box.maxFrameCount,
          },
        });
      });

      await Promise.all(boxPromises);

      // Return the hive with the updated boxes
      return tx.hive.findUnique({
        where: { id },
        include: {
          apiary: true,
          queens: {
            orderBy: {
              installedAt: 'desc',
            },
          },
          boxes: {
            orderBy: {
              position: 'asc',
            },
          },
          inspections: {
            orderBy: {
              date: 'desc',
            },
            include: {
              observations: true,
              actions: true,
            },
          },
        },
      });
    });

    // Transform to DTO
    if (!updatedHive) {
      throw new NotFoundException(
        `Hive with id ${id} not found after updating boxes`,
      );
    }

    return plainToInstance(HiveDetailResponseDto, {
      id: updatedHive.id,
      name: updatedHive.name,
      apiaryId: updatedHive.apiaryId,
      status: mapPrismaHiveStatusToDto(updatedHive.status),
      notes: updatedHive.notes,
      installationDate:
        typeof updatedHive.installationDate === 'string'
          ? updatedHive.installationDate
          : (updatedHive.installationDate?.toISOString() ?? null),
      lastInspectionDate:
        updatedHive.inspections && updatedHive.inspections.length > 0
          ? (updatedHive.inspections[0].date?.toISOString() ?? null)
          : null,
      boxes: updatedHive.boxes.map((box: Box) => ({
        id: box.id,
        position: box.position,
        frameCount: box.frameCount,
        type: box.type,
        maxFrameCount: box.maxFrameCount,
        hasExcluder: box.hasExcluder,
      })),
    });
  }
}
