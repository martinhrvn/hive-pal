import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHiveDto } from './dto/create-hive.dto';
import { UpdateHiveDto } from './dto/update-hive.dto';
import { HiveResponseDto } from './dto/hive-response.dto';
import { HiveDetailResponseDto } from './dto/hive-detail-response.dto';
import { plainToInstance } from 'class-transformer';
import { BoxTypeDto, UpdateHiveBoxesDto } from './dto/update-hive-boxes.dto';
import { Box } from '@prisma/client';
import { BoxResponseDto } from './dto/box-response.dto';
import { InspectionsService } from '../inspections/inspections.service';
import { InspectionScoreDto } from '../inspections/dto/inspection-score.dto';
import { MetricsService } from '../metrics/metrics.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';
import { CustomLoggerService } from '../logger/logger.service';
import { HiveStatusEnum } from './dto/hive-status.enum';
import { HiveFilterDto } from './dto/hive-filter.dto';

@Injectable()
export class HiveService {
  constructor(
    private prisma: PrismaService,
    private inspectionService: InspectionsService,
    private metricsService: MetricsService,
    private logger: CustomLoggerService,
  ) {
    this.logger.setContext('HiveService');
  }

  async create(createHiveDto: CreateHiveDto): Promise<HiveResponseDto> {
    this.logger.log(`Creating new hive in apiary ${createHiveDto.apiaryId}`);
    const hive = await this.prisma.hive.create({
      data: createHiveDto,
    });
    this.logger.log(`Hive created with ID: ${hive.id}`);
    return {
      id: hive.id,
      name: hive.name,
      apiaryId: hive.apiaryId,
      status: hive.status as HiveStatusEnum,
      notes: hive.notes,
      installationDate: hive.installationDate?.toISOString() ?? '',
      lastInspectionDate: null,
      activeQueen: null,
    };
  }

  async findAll(
    filter: ApiaryUserFilter & HiveFilterDto,
  ): Promise<HiveResponseDto[]> {
    this.logger.log(
      `Finding all hives for apiary ${filter.apiaryId} and user ${filter.userId}`,
    );
    const hives = await this.prisma.hive.findMany({
      where: {
        apiary: {
          id: filter.apiaryId,
          userId: filter.userId,
        },
        status: filter.includeInactive ? undefined : 'ACTIVE',
      },
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
        queens: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            installedAt: 'desc',
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
        status: hive.status as HiveStatusEnum,
        notes: hive.notes,
        installationDate: hive.installationDate?.toISOString() ?? '',
        lastInspectionDate: hive.inspections[0]?.date?.toISOString() ?? '',
        activeQueen: hive.queens.length > 0 ? hive.queens[0] : null,
      }),
    );
  }

  async findOne(id: string, filter: ApiaryUserFilter) {
    this.logger.log(
      `Finding hive with ID: ${id} for apiary ${filter.apiaryId} and user ${filter.userId}`,
    );
    const hive = await this.prisma.hive.findFirst({
      where: {
        id,
        apiary: {
          id: filter.apiaryId,
          userId: filter.userId,
        },
      },
      include: {
        apiary: true,
        queens: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            installedAt: 'desc',
          },
          take: 1,
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
      this.logger.warn(
        `Hive with ID: ${id} not found or user doesn't have access`,
      );
      throw new NotFoundException();
    }
    this.logger.debug(`Found hive: ${hive.name} (ID: ${hive.id})`);

    const activeQueen = hive.queens.length > 0 ? hive.queens[0] : null;
    const latestInspection =
      hive.inspections && hive.inspections.length > 0
        ? (hive.inspections[0] ?? null)
        : null;

    const metrics = this.inspectionService.mapObservationsToDto(
      latestInspection?.observations ?? [],
    );
    const score = this.metricsService.calculateOveralScore(metrics);
    return plainToInstance(HiveDetailResponseDto, {
      id: hive.id,
      name: hive.name,
      apiaryId: hive.apiaryId,
      status: hive.status as HiveStatusEnum,
      notes: hive.notes,
      installationDate:
        typeof hive.installationDate === 'string'
          ? hive.installationDate
          : (hive.installationDate?.toISOString() ?? null),
      lastInspectionDate: latestInspection?.date?.toISOString(),
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
      hiveScore: plainToInstance(InspectionScoreDto, score),
      activeQueen: activeQueen
        ? {
            id: activeQueen.id,
            hiveId: activeQueen.hiveId,
            marking: '', // Since the database field is markingColor
            color: activeQueen.color,
            year: activeQueen.year,
            source: activeQueen.source,
            status: activeQueen.status,
            installedAt: activeQueen.installedAt?.toISOString(),
            replacedAt: activeQueen.replacedAt?.toISOString() || null,
          }
        : null,
    });
  }

  async update(
    id: string,
    updateHiveDto: UpdateHiveDto,
    filter: ApiaryUserFilter,
  ) {
    this.logger.log(`Updating hive with ID: ${id}`);
    this.logger.debug(`Update data: ${JSON.stringify(updateHiveDto)}`);
    // Verify the hive belongs to the apiary and user before updating
    const hive = await this.prisma.hive.findFirst({
      where: {
        id,
        apiary: {
          id: filter.apiaryId,
          userId: filter.userId,
        },
      },
    });

    if (!hive) {
      this.logger.warn(
        `Hive with ID: ${id} not found or doesn't belong to this apiary`,
      );
      throw new NotFoundException(
        `Hive with id ${id} not found or doesn't belong to this apiary`,
      );
    }

    const updatedHive = await this.prisma.hive.update({
      where: { id },
      data: {
        ...updateHiveDto,
        installationDate: updateHiveDto.installationDate
          ? new Date(updateHiveDto.installationDate)
          : null,
      },
    });
    this.logger.log(`Hive with ID: ${id} updated successfully`);
    return updatedHive;
  }

  async remove(id: string, filter: ApiaryUserFilter) {
    this.logger.log(`Removing hive with ID: ${id}`);
    // Verify the hive belongs to the apiary and user before deleting
    const hive = await this.prisma.hive.findFirst({
      where: {
        id,
        apiary: {
          id: filter.apiaryId,
          userId: filter.userId,
        },
      },
    });

    if (!hive) {
      this.logger.warn(
        `Hive with ID: ${id} not found or doesn't belong to this apiary when attempting removal`,
      );
      throw new NotFoundException(
        `Hive with id ${id} not found or doesn't belong to this apiary`,
      );
    }

    const deletedHive = await this.prisma.hive.update({
      data: { status: 'ARCHIVED' },
      where: { id },
    });
    this.logger.log(`Hive with ID: ${id} removed successfully`);
    return deletedHive;
  }

  async updateBoxes(
    id: string,
    updateHiveBoxesDto: UpdateHiveBoxesDto,
    filter: ApiaryUserFilter,
  ) {
    this.logger.log(`Updating boxes for hive with ID: ${id}`);
    this.logger.debug(`Box data: ${JSON.stringify(updateHiveBoxesDto)}`);
    // First check if the hive exists and belongs to the user/apiary
    const hive = await this.prisma.hive.findFirst({
      where: {
        id,
        apiary: {
          id: filter.apiaryId,
          userId: filter.userId,
        },
      },
    });

    if (!hive) {
      this.logger.warn(`Hive with ID: ${id} not found when updating boxes`);
      throw new NotFoundException(`Hive with id ${id} not found`);
    }

    this.logger.debug(`Found hive, proceeding with box updates`);
    // Use a transaction to ensure atomicity
    const updatedHive = await this.prisma.$transaction(async (tx) => {
      // First, delete all existing boxes for this hive
      this.logger.debug(`Deleting existing boxes for hive: ${id}`);
      await tx.box.deleteMany({
        where: { hiveId: id },
      });
      this.logger.debug(`Existing boxes deleted successfully`);

      // Then create all the new boxes
      this.logger.debug(
        `Creating ${updateHiveBoxesDto.boxes.length} new boxes for hive: ${id}`,
      );
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
      this.logger.debug(`All new boxes created successfully`);

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
      this.logger.error(
        `Hive with ID: ${id} not found after updating boxes - this should not happen`,
      );
      throw new NotFoundException(
        `Hive with id ${id} not found after updating boxes`,
      );
    }

    this.logger.log(`Successfully updated boxes for hive: ${id}`);

    return plainToInstance(HiveDetailResponseDto, {
      id: updatedHive.id,
      name: updatedHive.name,
      apiaryId: updatedHive.apiaryId,
      status: updatedHive.status as HiveStatusEnum,
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
