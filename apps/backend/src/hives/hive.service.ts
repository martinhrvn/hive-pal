import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { InspectionsService } from '../inspections/inspections.service';
import { MetricsService } from '../metrics/metrics.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';
import { CustomLoggerService } from '../logger/logger.service';
import { Box as PrismaBox } from '@prisma/client';
import { HiveCreatedEvent, HiveUpdatedEvent } from '../events/hive.events';
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
  HiveSettings,
  AlertSeverity,
  AlertStatus,
  isVariantCompatible,
} from 'shared-schemas';

@Injectable()
export class HiveService {
  constructor(
    private prisma: PrismaService,
    private inspectionService: InspectionsService,
    private metricsService: MetricsService,
    private logger: CustomLoggerService,
    private eventEmitter: EventEmitter2,
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

    // Extract boxes from DTO if provided
    const { boxes, ...hiveData } = createHiveDto;

    // Create hive with boxes in a transaction if boxes are provided
    const result = await this.prisma.$transaction(async (prisma) => {
      const hive = await prisma.hive.create({
        data: {
          ...hiveData,
          settings: createHiveDto.settings || defaultSettings,
        },
        include: {
          apiary: {
            select: {
              userId: true,
            },
          },
        },
      });

      // Create boxes if provided
      if (boxes && boxes.length > 0) {
        await prisma.box.createMany({
          data: boxes.map((box) => ({
            hiveId: hive.id,
            position: box.position,
            frameCount: box.frameCount,
            maxFrameCount: box.maxFrameCount || 10,
            hasExcluder: box.hasExcluder,
            type: box.type,
            variant: box.variant,
            color: box.color,
            winterized: box.winterized ?? false,
          })),
        });
        this.logger.log(`Created ${boxes.length} boxes for hive ${hive.id}`);
      }

      return hive;
    });

    this.logger.log(`Hive created with ID: ${result.id}`);

    // Emit event for new hive creation
    const userId = result.apiary?.userId || 'unknown';
    this.eventEmitter.emit(
      'hive.created',
      new HiveCreatedEvent(result.id, createHiveDto.apiaryId || '', userId),
    );

    return {
      id: result.id,
      status: result.status as HiveStatus,
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
        where: {
          status: {
            not: 'SCHEDULED' as const,
          },
        },
        select: {
          date: true,
        },
        orderBy: {
          date: 'desc' as const,
        },
        take: 1,
      } as const,
      queens: {
        where: {
          status: 'ACTIVE' as const,
        },
        orderBy: {
          installedAt: 'desc' as const,
        },
        take: 1,
      },
      alerts: {
        where: {
          status: 'ACTIVE' as const,
        },
        orderBy: {
          createdAt: 'desc' as const,
        },
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
        settings: (hive.settings as HiveSettings) || undefined,
        activeQueen:
          hive.queens.length > 0
            ? {
                id: hive.queens[0].id,
                hiveId: hive.queens[0].hiveId || undefined,
                year: hive.queens[0].year || undefined,
              }
            : null,
        alerts:
          hive.alerts?.map((alert) => ({
            id: alert.id,
            hiveId: alert.hiveId || undefined,
            type: alert.type,
            message: alert.message,
            severity: alert.severity as AlertSeverity,
            status: alert.status as AlertStatus,
            metadata: alert.metadata as Record<string, string> | undefined,
            createdAt: alert.createdAt.toISOString(),
            updatedAt: alert.updatedAt.toISOString(),
          })) || [],
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
            winterized: box.winterized,
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
          where: {
            status: 'COMPLETED',
          },
          orderBy: {
            date: 'desc',
          },
          take: 1,
          include: {
            observations: true,
            actions: true,
          },
        },
        alerts: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            createdAt: 'desc',
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

    // Get the latest completed inspection (filtered at query level)
    const latestCompletedInspection = hive.inspections[0] ?? null;

    const metrics = this.inspectionService.mapObservationsToDto(
      latestCompletedInspection?.observations ?? [],
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
      lastInspectionDate: latestCompletedInspection?.date?.toISOString(),
      settings: (hive.settings as HiveSettings) || undefined,
      boxes: hive.boxes.map((box) => ({
        id: box.id,
        position: box.position,
        frameCount: box.frameCount,
        maxFrameCount: box.maxFrameCount,
        hasExcluder: box.hasExcluder,
        color: box.color ?? undefined,
        type: box.type as BoxTypeEnum,
        variant: box.variant as BoxVariantEnum,
        winterized: box.winterized,
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
      alerts:
        hive.alerts?.map((alert) => ({
          id: alert.id,
          hiveId: alert.hiveId || undefined,
          type: alert.type,
          message: alert.message,
          severity: alert.severity as AlertSeverity,
          status: alert.status as AlertStatus,
          metadata: alert.metadata as Record<string, string> | undefined,
          createdAt: alert.createdAt.toISOString(),
          updatedAt: alert.updatedAt.toISOString(),
        })) || [],
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

    // Extract boxes from updateHiveDto to avoid Prisma type errors
    const { boxes: _, ...hiveUpdateData } = updateHiveDto;

    const updatedHive = await this.prisma.hive.update({
      where: { id },
      data: {
        ...hiveUpdateData,
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

    // Determine update type
    let updateType: 'status' | 'settings' | 'general' = 'general';
    if (updateHiveDto.status) {
      updateType = 'status';
    } else if (updateHiveDto.settings) {
      updateType = 'settings';
    }

    // Emit event for hive update
    this.eventEmitter.emit(
      'hive.updated',
      new HiveUpdatedEvent(id, filter.apiaryId, filter.userId, updateType),
    );

    return {
      id: updatedHive.id,
      name: updatedHive.name,
      apiaryId: updatedHive.apiaryId || undefined,
      status: updatedHive.status as HiveStatus,
      notes: updatedHive.notes || undefined,
      installationDate: updatedHive.installationDate?.toISOString(),
      positionRow: updatedHive.positionRow ?? undefined,
      positionCol: updatedHive.positionCol ?? undefined,
      settings: (updatedHive.settings as HiveSettings) || undefined,
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
      include: {
        boxes: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!hive) {
      this.logger.warn(`Hive with ID: ${id} not found when updating boxes`);
      throw new NotFoundException(`Hive with id ${id} not found`);
    }

    // Calculate changes before the transaction
    const oldBoxes = hive.boxes || [];
    const newBoxes = updateHiveBoxesDto.boxes || [];

    const oldBoxCount = oldBoxes.length;
    const newBoxCount = newBoxes.length;
    const oldFrameCount = oldBoxes.reduce(
      (sum, box) => sum + (box.frameCount || 0),
      0,
    );
    const newFrameCount = newBoxes.reduce(
      (sum, box) => sum + (box.frameCount || 0),
      0,
    );

    const boxesAdded = Math.max(0, newBoxCount - oldBoxCount);
    const boxesRemoved = Math.max(0, oldBoxCount - newBoxCount);
    const framesAdded = Math.max(0, newFrameCount - oldFrameCount);
    const framesRemoved = Math.max(0, oldFrameCount - newFrameCount);

    // Validate variant compatibility
    if (newBoxes.length > 0) {
      const mainBox = newBoxes.find((b) => b.position === 0);
      const mainBoxVariant = mainBox?.variant;
      if (mainBoxVariant) {
        const incompatibleBoxes = newBoxes.filter(
          (b) =>
            b.position !== 0 &&
            b.variant &&
            !isVariantCompatible(mainBoxVariant, b.variant),
        );

        if (incompatibleBoxes.length > 0) {
          throw new BadRequestException(
            `Boxes at positions ${incompatibleBoxes.map((b) => b.position).join(', ')} ` +
              `are not compatible with the main box variant (${mainBoxVariant})`,
          );
        }
      }
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
            variant: box.variant,
            color: box.color,
            winterized: box.winterized ?? false,
          },
        });
      });

      await Promise.all(boxPromises);
      this.logger.debug(`All new boxes created successfully`);

      // Create action record if there were changes
      if (
        boxesAdded > 0 ||
        boxesRemoved > 0 ||
        framesAdded > 0 ||
        framesRemoved > 0
      ) {
        this.logger.debug(
          `Creating box configuration action for tracking changes`,
        );

        // Create the action record
        const action = await tx.action.create({
          data: {
            hiveId: id,
            type: 'BOX_CONFIGURATION',
            notes:
              `Box configuration updated: ${boxesAdded > 0 ? `+${boxesAdded} boxes` : ''}${boxesRemoved > 0 ? `-${boxesRemoved} boxes` : ''} ${framesAdded > 0 ? `+${framesAdded} frames` : ''}${framesRemoved > 0 ? `-${framesRemoved} frames` : ''}`.trim(),
            date: new Date(),
          },
        });

        // Create the box configuration action details
        await tx.boxConfigurationAction.create({
          data: {
            actionId: action.id,
            boxesAdded,
            boxesRemoved,
            framesAdded,
            framesRemoved,
            totalBoxes: newBoxCount,
            totalFrames: newFrameCount,
          },
        });

        this.logger.debug(`Box configuration action created successfully`);
      }

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

    // Emit event for box update
    this.eventEmitter.emit(
      'hive.updated',
      new HiveUpdatedEvent(id, filter.apiaryId, filter.userId, 'boxes'),
    );

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
      settings: (updatedHive.settings as HiveSettings) || undefined,
    };
  }
}
