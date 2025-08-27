import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InspectionsService } from '../inspections/inspections.service';
import { MetricsService } from '../metrics/metrics.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';
import { CustomLoggerService } from '../logger/logger.service';
import { Box as PrismaBox } from '@prisma/client';
import {
  CreateHive,
  UpdateHive,
  HiveResponse,
  HiveDetailResponse,
  UpdateHiveBoxes,
  BoxTypeEnum,
  HiveStatus,
  HiveFilter,
  UpdateHiveResponse,
  CreateHiveResponse,
  BoxVariantEnum,
} from 'shared-schemas';

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

  async create(createHiveDto: CreateHive): Promise<CreateHiveResponse> {
    this.logger.log(`Creating new hive in apiary ${createHiveDto.apiaryId}`);
    
    // Apply default settings if not provided
    const defaultSettings = {
      autumnFeeding: {
        startMonth: 8,
        endMonth: 10,
        amountKg: 12,
      },
      inspection: {
        frequencyDays: 7,
      },
    };
    
    const hive = await this.prisma.hive.create({
      data: {
        ...createHiveDto,
        settings: createHiveDto.settings || defaultSettings,
      },
    });
    this.logger.log(`Hive created with ID: ${hive.id}`);
    return {
      id: hive.id,
      status: hive.status as HiveStatus,
    };
  }

  async findAll(
    filter: ApiaryUserFilter & HiveFilter,
  ): Promise<HiveResponse[]> {
    this.logger.log(
      `Finding all hives for apiary ${filter.apiaryId} and user ${filter.userId}`,
    );

    const includeConfig = {
      inspections: {
        select: {
          date: true,
        },
        orderBy: {
          date: 'desc' as const,
        },
        take: 1,
      },
      queens: {
        where: {
          status: 'ACTIVE' as const,
        },
        orderBy: {
          installedAt: 'desc' as const,
        },
        take: 1,
      },
      ...(filter.includeBoxes && {
        boxes: {
          orderBy: {
            position: 'asc' as const,
          },
        },
      }),
    };

    const hives = await this.prisma.hive.findMany({
      where: {
        apiary: {
          id: filter.apiaryId,
          userId: filter.userId,
        },
        status: filter.includeInactive ? undefined : 'ACTIVE',
      },
      include: includeConfig,
    });

    return hives.map((hive): HiveResponse => {
      const baseHive = {
        id: hive.id,
        name: hive.name,
        apiaryId: hive.apiaryId || undefined,
        status: hive.status as HiveStatus,
        notes: hive.notes || undefined,
        installationDate: hive.installationDate?.toISOString(),
        lastInspectionDate: hive.inspections[0]?.date?.toISOString(),
        positionRow: hive.positionRow ?? undefined,
        positionCol: hive.positionCol ?? undefined,
        settings: hive.settings || undefined,
        activeQueen:
          hive.queens.length > 0
            ? {
                id: hive.queens[0].id,
                hiveId: hive.queens[0].hiveId || undefined,
                year: hive.queens[0].year || undefined,
              }
            : null,
      };

      // Add boxes if requested
      if (filter.includeBoxes && 'boxes' in hive) {
        return {
          ...baseHive,
          boxes: hive.boxes.map((box: PrismaBox) => ({
            id: box.id,
            position: box.position,
            frameCount: box.frameCount,
            maxFrameCount: box.maxFrameCount,
            hasExcluder: box.hasExcluder,
            type: box.type as BoxTypeEnum,
            variant: box.variant as BoxVariantEnum,
            color: box.color ?? undefined,
          })),
        };
      }

      return baseHive;
    });
  }

  async findOne(
    id: string,
    filter: ApiaryUserFilter,
  ): Promise<HiveDetailResponse> {
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

    return {
      id: hive.id,
      name: hive.name,
      apiaryId: hive.apiaryId || undefined,
      status: hive.status as HiveStatus,
      notes: hive.notes || undefined,
      installationDate:
        typeof hive.installationDate === 'string'
          ? hive.installationDate
          : hive.installationDate?.toISOString(),
      lastInspectionDate: latestInspection?.date?.toISOString(),
      settings: hive.settings || undefined,
      boxes: hive.boxes.map((box) => ({
        id: box.id,
        position: box.position,
        frameCount: box.frameCount,
        maxFrameCount: box.maxFrameCount,
        hasExcluder: box.hasExcluder,
        type: box.type as BoxTypeEnum,
      })),
      hiveScore: score,
      activeQueen: activeQueen
        ? {
            id: activeQueen.id,
            hiveId: activeQueen.hiveId || undefined,
            marking: activeQueen.marking || null,
            color: activeQueen.color,
            year: activeQueen.year,
            status: activeQueen.status,
            installedAt: activeQueen.installedAt?.toISOString(),
          }
        : null,
    };
  }

  async update(
    id: string,
    updateHiveDto: UpdateHive,
    filter: ApiaryUserFilter,
  ): Promise<UpdateHiveResponse> {
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
      include: {
        queens: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            installedAt: 'desc',
          },
          take: 1,
        },
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
    this.logger.log(`Hive with ID: ${id} updated successfully`);

    return {
      id: updatedHive.id,
      name: updatedHive.name,
      apiaryId: updatedHive.apiaryId || undefined,
      status: updatedHive.status as HiveStatus,
      notes: updatedHive.notes || undefined,
      installationDate: updatedHive.installationDate?.toISOString(),
      positionRow: updatedHive.positionRow ?? undefined,
      positionCol: updatedHive.positionCol ?? undefined,
      settings: updatedHive.settings || undefined,
    };
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
    updateHiveBoxesDto: UpdateHiveBoxes,
    filter: ApiaryUserFilter,
  ): Promise<UpdateHiveResponse> {
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
            variant: box.variant, // New field for box variant
            color: box.color, // New field for box color
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

    return {
      id: updatedHive.id,
      name: updatedHive.name,
      apiaryId: updatedHive.apiaryId || undefined,
      status: updatedHive.status as HiveStatus,
      notes: updatedHive.notes || undefined,
      installationDate:
        typeof updatedHive.installationDate === 'string'
          ? updatedHive.installationDate
          : updatedHive.installationDate?.toISOString(),
      settings: updatedHive.settings || undefined,
    };
  }
}
