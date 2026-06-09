import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { InspectionsService } from '../inspections/inspections.service';
import { MetricsService } from '../metrics/metrics.service';
import { FileUploadService } from '../storage/file-upload.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';
import { CustomLoggerService } from '../logger/logger.service';
import { Box as PrismaBox } from '@/prisma/client';
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
  parseApiaryInspectionType,
} from 'shared-schemas';
import { safeJsonParse } from '../utils/safe-json-parse';
import { getStoredOrCalculatedScore } from '../utils/score-utils';
import { z } from 'zod';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class HiveService {
  private readonly stringArraySchema = z.array(z.string());

  constructor(
    private prisma: PrismaService,
    private inspectionService: InspectionsService,
    private metricsService: MetricsService,
    private fileUpload: FileUploadService,
    private logger: CustomLoggerService,
    private eventEmitter: EventEmitter2,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly winstonLogger: Logger,
  ) {
    this.logger.setContext('HiveService');
  }

  private parseJsonArray(raw: string | null | undefined): string[] {
    return (
      safeJsonParse(
        raw,
        this.stringArraySchema,
        this.winstonLogger,
        'box configuration',
      ) ?? []
    );
  }

  private resolveStatusFilter(filter: HiveFilter): HiveStatus | undefined {
    if (filter.status) return filter.status;
    if (filter.includeInactive) return undefined;
    return HiveStatus.ACTIVE;
  }

  private async mapFeaturePhotoUrl(
    featurePhoto: { id: string; storageKey: string } | null,
  ): Promise<{
    featurePhotoId: string | null;
    featurePhotoUrl: string | null;
  }> {
    if (!featurePhoto) {
      return { featurePhotoId: null, featurePhotoUrl: null };
    }
    try {
      const { downloadUrl } = await this.fileUpload.getDownloadUrl(
        featurePhoto.storageKey,
      );
      return { featurePhotoId: featurePhoto.id, featurePhotoUrl: downloadUrl };
    } catch {
      return { featurePhotoId: featurePhoto.id, featurePhotoUrl: null };
    }
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
        calendarEnabled: true,
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
          data: boxes.map((box) => {
            let addedAt: Date;
            if (box.addedAt instanceof Date) {
              addedAt = box.addedAt;
            } else if (box.addedAt) {
              addedAt = new Date(box.addedAt);
            } else {
              addedAt = new Date();
            }

            return {
              hiveId: hive.id,
              position: box.position,
              frameCount: box.frameCount,
              maxFrameCount: box.maxFrameCount || 10,
              hasExcluder: box.hasExcluder,
              type: box.type,
              variant: box.variant,
              frameSizeId: box.frameSizeId ?? null,
              color: box.color,
              addedAt,
              winterized: box.winterized ?? false,
            };
          }),
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
          overallScore: true,
          scoreWarnings: true,
          observations: {
            where: { type: { in: ['strength', 'total_frames'] } },
            select: { type: true, numericValue: true },
          },
        },
        orderBy: {
          date: 'desc' as const,
        },
        take: 2,
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
      alerts: {
        where: {
          status: 'ACTIVE' as const,
        },
        orderBy: {
          createdAt: 'desc' as const,
        },
      },
      apiary: {
        select: {
          settings: true,
        },
      },
      ...(filter.includeBoxes && {
        boxes: {
          orderBy: {
            position: 'asc' as const,
          },
        },
      }),
      featurePhoto: { select: { id: true, storageKey: true } },
    };

    const hives = await this.prisma.hive.findMany({
      where: {
        apiary: {
          id: filter.apiaryId,
          ...(filter.apiaryId
            ? {}
            : {
                OR: [
                  { userId: filter.userId },
                  {
                    members: {
                      some: { userId: filter.userId, status: 'ACTIVE' },
                    },
                  },
                ],
              }),
        },
        status: this.resolveStatusFilter(filter),
      },
      include: includeConfig,
    });

    return Promise.all(
      hives.map(async (hive): Promise<HiveResponse> => {
        const featurePhotoFields = await this.mapFeaturePhotoUrl(
          hive.featurePhoto,
        );
        const baseHive = {
          id: hive.id,
          name: hive.name,
          apiaryId: hive.apiaryId || undefined,
          status: hive.status as HiveStatus,
          updatedAt: hive.updatedAt.toISOString(),
          notes: hive.notes || undefined,
          installationDate: hive.installationDate?.toISOString(),
          lastInspectionDate: hive.inspections[0]?.date?.toISOString(),
          lastInspectionStrength:
            hive.inspections[0]?.observations?.find(
              (o) => o.type === 'strength',
            )?.numericValue ?? null,
          lastInspectionTotalFrames:
            hive.inspections[0]?.observations?.find(
              (o) => o.type === 'total_frames',
            )?.numericValue ?? null,
          lastInspectionOverallScore: hive.inspections[0]?.overallScore ?? null,
          previousInspectionStrength:
            hive.inspections[1]?.observations?.find(
              (o) => o.type === 'strength',
            )?.numericValue ?? null,
          lastInspectionWarnings: this.parseJsonArray(
            hive.inspections[0]?.scoreWarnings,
          ),
          positionRow: hive.positionRow ?? undefined,
          positionCol: hive.positionCol ?? undefined,
          settings: (hive.settings as HiveSettings) || undefined,
          activeQueen:
            hive.queens.length > 0
              ? {
                  id: hive.queens[0].id,
                  hiveId: hive.queens[0].hiveId || undefined,
                  year: hive.queens[0].year || undefined,
                  source: hive.queens[0].source || undefined,
                  marking: hive.queens[0].marking || null,
                  color: hive.queens[0].color,
                  status: hive.queens[0].status,
                  installedAt: hive.queens[0].installedAt?.toISOString(),
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
          ...featurePhotoFields,
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
              frameSizeId: box.frameSizeId ?? undefined,
              color: box.color ?? undefined,
              addedAt: box.addedAt?.toISOString(),
              winterized: box.winterized,
            })),
          };
        }

        return baseHive;
      }),
    );
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
        },
      },
      include: {
        apiary: { select: { settings: true } },
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
          include: {
            frameSize: true,
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
        featurePhoto: { select: { id: true, storageKey: true } },
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

    const inspectionType = parseApiaryInspectionType(hive.apiary?.settings);
    const score = (() => {
      if (inspectionType === 'subjective' || !latestCompletedInspection) {
        return undefined;
      }

      const metrics = this.inspectionService.mapObservationsToDto(
        latestCompletedInspection.observations,
      );
      const insp = latestCompletedInspection as Record<string, unknown>;

      return getStoredOrCalculatedScore(insp, metrics, (json: string) =>
        this.parseJsonArray(json),
      );
    })();
    const featurePhotoFields = await this.mapFeaturePhotoUrl(hive.featurePhoto);

    return {
      id: hive.id,
      name: hive.name,
      apiaryId: hive.apiaryId || undefined,
      status: hive.status as HiveStatus,
      updatedAt: hive.updatedAt.toISOString(),
      notes: hive.notes || undefined,
      installationDate:
        typeof hive.installationDate === 'string'
          ? hive.installationDate
          : hive.installationDate?.toISOString(),
      lastInspectionDate: latestCompletedInspection?.date?.toISOString(),
      settings: (hive.settings as HiveSettings) || undefined,
      inspectionType: parseApiaryInspectionType(hive.apiary?.settings),
      ...featurePhotoFields,
      boxes: hive.boxes.map((box) => ({
        id: box.id,
        position: box.position,
        frameCount: box.frameCount,
        maxFrameCount: box.maxFrameCount,
        hasExcluder: box.hasExcluder,
        color: box.color ?? undefined,
        addedAt: box.addedAt?.toISOString(),
        type: box.type as BoxTypeEnum,
        variant: box.variant as BoxVariantEnum,
        frameSizeId: box.frameSizeId ?? undefined,
        frameSize:
          'frameSize' in box
            ? ((box as Record<string, unknown>).frameSize ?? undefined)
            : undefined,
        winterized: box.winterized,
      })),
      hiveScore: score ?? {
        overallScore: null,
        populationScore: null,
        storesScore: null,
        queenScore: null,
        warnings: [],
        confidence: 0,
      },
      activeQueen: activeQueen
        ? {
            id: activeQueen.id,
            hiveId: activeQueen.hiveId || undefined,
            marking: activeQueen.marking || null,
            color: activeQueen.color,
            year: activeQueen.year,
            status: activeQueen.status,
            source: activeQueen.source || undefined,
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

    // Extract boxes and featurePhotoId from updateHiveDto to handle separately
    const { boxes: _, featurePhotoId, ...hiveUpdateData } = updateHiveDto;

    const updatedHive = await this.prisma.hive.update({
      where: { id },
      data: {
        ...hiveUpdateData,
        installationDate: updateHiveDto.installationDate
          ? new Date(updateHiveDto.installationDate)
          : null,
        ...(featurePhotoId !== undefined && {
          featurePhotoId: featurePhotoId ?? null,
        }),
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
        featurePhoto: { select: { id: true, storageKey: true } },
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

    const featurePhotoFields = await this.mapFeaturePhotoUrl(
      updatedHive.featurePhoto,
    );

    return {
      id: updatedHive.id,
      name: updatedHive.name,
      updatedAt: updatedHive.updatedAt.toISOString(),
      apiaryId: updatedHive.apiaryId || undefined,
      status: updatedHive.status as HiveStatus,
      notes: updatedHive.notes || undefined,
      installationDate: updatedHive.installationDate?.toISOString(),
      positionRow: updatedHive.positionRow ?? undefined,
      positionCol: updatedHive.positionCol ?? undefined,
      settings: (updatedHive.settings as HiveSettings) || undefined,
      ...featurePhotoFields,
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

    const oldBoxesById = new Map(oldBoxes.map((box) => [box.id, box]));
    const oldBoxesByPosition = new Map(
      oldBoxes.map((box) => [box.position, box]),
    );

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
            // Always let Prisma generate a fresh id. Boxes are deleted and
            // recreated wholesale here and nothing references Box.id, so
            // reusing the client-supplied id only risks unique-constraint
            // collisions (duplicate ids in the payload, or an id that belongs
            // to another hive and was therefore not deleted above).
            hiveId: id,
            position: box.position,
            frameCount: box.frameCount,
            hasExcluder: box.hasExcluder,
            type: box.type, // BoxType enum matches our DTO enum
            maxFrameCount: box.maxFrameCount,
            variant: box.variant,
            frameSizeId: box.frameSizeId ?? null,
            color: box.color,
            addedAt:
              box.addedAt instanceof Date
                ? box.addedAt
                : box.addedAt
                  ? new Date(box.addedAt)
                  : ((box.id
                      ? (
                          oldBoxesById.get(box.id) as
                            | { addedAt?: Date }
                            | undefined
                        )?.addedAt
                      : undefined) ??
                    (
                      oldBoxesByPosition.get(box.position) as
                        | { addedAt?: Date }
                        | undefined
                    )?.addedAt ??
                    new Date()),
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
      updatedAt: updatedHive.updatedAt.toISOString(),
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
