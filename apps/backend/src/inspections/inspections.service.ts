import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { Observation, Prisma } from '@/prisma/client';
import { MetricsService } from '../metrics/metrics.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';
import { ActionsService } from '../actions/actions.service';
import { CustomLoggerService } from '../logger/logger.service';
import { InspectionCreatedEvent } from '../events/hive.events';
import { InspectionStatusUpdaterService } from './inspection-status-updater.service';
import { InspectionAudioService } from '../inspection-audio/inspection-audio.service';
import { PhotosService } from '../photos/photos.service';
import { safeJsonParse } from '../utils/safe-json-parse';
import { getStoredOrCalculatedScore } from '../utils/score-utils';
import { z } from 'zod';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

type InspectionWithIncludes = Prisma.InspectionGetPayload<{
  include: {
    observations: true;
    notes: true;
    actions: {
      include: {
        feedingAction: true;
        treatmentAction: true;
        frameAction: true;
        harvestAction: true;
        boxConfigurationAction: true;
        maintenanceAction: true;
        createdByUser: { select: { name: true; email: true } };
      };
    };
    hive: {
      select: {
        name: true;
        apiary: {
          select: {
            settings: true;
          };
        };
      };
    };
    createdByUser: {
      select: {
        name: true;
        email: true;
      };
    };
  };
}>;
import {
  ActionType,
  CreateAction,
  CreateInspection,
  CreateInspectionResponse,
  InspectionFilter,
  InspectionResponse,
  InspectionStatus,
  ObservationSchemaType,
  UpdateInspection,
  UpdateInspectionResponse,
  BroodPatternType,
  AdditionalObservationType,
  ReminderObservationType,
  ScoreResult,
  parseApiaryInspectionType,
  calculateScores,
} from 'shared-schemas';

const ACTION_INCLUDE = {
  feedingAction: true,
  treatmentAction: true,
  frameAction: true,
  harvestAction: true,
  boxConfigurationAction: true,
  maintenanceAction: true,
  createdByUser: { select: { name: true, email: true } },
};

/**
 * Common include structure for inspection queries (used in findAll, findOne, findOverdue, findDueToday).
 * Centralized to avoid duplication and ensure consistency across all inspection query methods.
 */
const INSPECTION_INCLUDE = {
  observations: true,
  notes: true,
  actions: {
    include: ACTION_INCLUDE,
  },
  hive: {
    select: {
      name: true,
      apiary: {
        select: {
          settings: true,
        },
      },
    },
  },
  createdByUser: { select: { name: true, email: true } },
} as const;

@Injectable()
export class InspectionsService {
  private readonly stringArraySchema = z.array(z.string());

  constructor(
    private prisma: PrismaService,
    private metricService: MetricsService,
    private actionsService: ActionsService,
    private logger: CustomLoggerService,
    private eventEmitter: EventEmitter2,
    private inspectionStatusUpdater: InspectionStatusUpdaterService,
    @Inject(forwardRef(() => InspectionAudioService))
    private audioService: InspectionAudioService,
    private photosService: PhotosService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly winstonLogger: Logger,
  ) {}

  /**
   * Sums the net frame quantity (added - removed) across all FRAME actions in an
   * incoming actions payload. Returns 0 when there are no frame actions.
   */
  private sumFrameActionDelta(actions?: CreateAction[]): number {
    if (!actions || actions.length === 0) return 0;
    return actions.reduce((sum, action) => {
      if (action.details?.type === ActionType.FRAME) {
        return sum + action.details.quantity;
      }
      return sum;
    }, 0);
  }

  /**
   * Returns the net frame delta that has already been persisted for an
   * inspection (sum of its stored FrameAction quantities).
   */
  private async getInspectionFrameDelta(
    tx: Prisma.TransactionClient,
    inspectionId: string,
  ): Promise<number> {
    const frameActions = await tx.frameAction.findMany({
      where: { action: { inspectionId } },
      select: { quantity: true },
    });
    return frameActions.reduce((sum, fa) => sum + fa.quantity, 0);
  }

  /**
   * Applies a signed frame delta to a hive's brood boxes, keeping the stored
   * frame counts in sync with frame (Rähmchen) actions. Frames are added to /
   * removed from the topmost brood box first, respecting each box's
   * maxFrameCount and never dropping below zero. Any surplus that cannot fit
   * within capacity is added to the last brood box so the recorded change is
   * never silently lost.
   */
  private async applyFrameDeltaToBroodBoxes(
    tx: Prisma.TransactionClient,
    hiveId: string,
    delta: number,
  ): Promise<void> {
    if (!delta) return;

    const broodBoxes = await tx.box.findMany({
      where: { hiveId, type: 'BROOD' },
      orderBy: { position: 'asc' },
    });
    if (broodBoxes.length === 0) return;

    let remaining = delta;
    // Process from the topmost brood box (highest position) downward.
    const ordered = [...broodBoxes].reverse();
    for (const box of ordered) {
      if (remaining === 0) break;
      if (remaining > 0) {
        const capacity = Math.max(0, box.maxFrameCount - box.frameCount);
        const add = Math.min(capacity, remaining);
        if (add > 0) {
          await tx.box.update({
            where: { id: box.id },
            data: { frameCount: box.frameCount + add },
          });
          remaining -= add;
        }
      } else {
        const removable = Math.min(box.frameCount, -remaining);
        if (removable > 0) {
          await tx.box.update({
            where: { id: box.id },
            data: { frameCount: box.frameCount - removable },
          });
          remaining += removable;
        }
      }
    }

    // If additions did not fully fit within capacity, place the surplus on the
    // last brood box so the recorded frame change is preserved.
    if (remaining > 0) {
      const lastBox = broodBoxes[broodBoxes.length - 1];
      await tx.box.update({
        where: { id: lastBox.id },
        data: { frameCount: { increment: remaining } },
      });
    }
  }

  async create(
    createInspectionDto: CreateInspection,
    filter: ApiaryUserFilter,
  ): Promise<CreateInspectionResponse> {
    // Verify that the hive belongs to the user's apiary
    const hive = await this.prisma.hive.findFirst({
      where: {
        id: createInspectionDto.hiveId,
        apiary: {
          id: filter.apiaryId,
        },
      },
      select: {
        id: true,
        apiary: {
          select: {
            settings: true,
          },
        },
      },
    });

    if (!hive) {
      throw new NotFoundException(
        `Hive with ID ${createInspectionDto.hiveId} not found or doesn't belong to this apiary`,
      );
    }
    const {
      observations,
      notes,
      actions,
      score: scoreOverride,
      ...inspectionData
    } = createInspectionDto;

    return this.prisma.$transaction(
      async (tx): Promise<CreateInspectionResponse> => {
        const status =
          createInspectionDto.status ||
          (new Date(createInspectionDto.date) > new Date()
            ? 'SCHEDULED'
            : 'COMPLETED');

        const inspectionType = parseApiaryInspectionType(hive.apiary?.settings);
        const calculatedScore =
          observations && inspectionType !== 'subjective'
            ? calculateScores(observations)
            : null;
        const scoreData = this.getScoreData(
          scoreOverride,
          calculatedScore,
          false,
        );

        const inspection = await tx.inspection.create({
          data: {
            ...inspectionData,
            status: status,
            createdByUserId: filter.userId,
            ...scoreData,
            observations: {
              create: observations
                ? this.buildObservationRecords(observations)
                : [],
            },
          },
        });

        // Add notes if provided
        if (notes) {
          await tx.inspectionNote.create({
            data: {
              inspectionId: inspection.id,
              text: notes,
            },
          });
        }

        // Add actions using ActionsService
        if (actions && actions.length > 0) {
          await this.actionsService.createActions(
            inspection.id,
            actions,
            tx,
            filter.userId,
          );

          // Keep the hive's brood-box frame counts in sync with frame actions
          await this.applyFrameDeltaToBroodBoxes(
            tx,
            inspection.hiveId,
            this.sumFrameActionDelta(actions),
          );
        }

        // Emit event for new inspection
        this.eventEmitter.emit(
          'inspection.created',
          new InspectionCreatedEvent(
            inspection.hiveId,
            filter.apiaryId,
            filter.userId,
            inspection.id,
            inspection.date,
          ),
        );

        return {
          date: inspection.date.toISOString(),
          id: inspection.id,
          hiveId: inspection.hiveId,
          status: inspection.status as InspectionStatus,
        };
      },
    );
  }

  async findAll(
    filter: InspectionFilter & Partial<ApiaryUserFilter>,
  ): Promise<InspectionResponse[]> {
    await this.inspectionStatusUpdater.checkAndUpdateInspectionStatuses();

    const whereClause: Prisma.InspectionWhereInput = {
      hiveId: filter.hiveId ?? undefined,
      ...(filter.startDate || filter.endDate
        ? {
            date: {
              ...(filter.startDate && { gte: new Date(filter.startDate) }),
              ...(filter.endDate && { lte: new Date(filter.endDate) }),
            },
          }
        : {}),
      ...this.getApiaryFilter(filter),
    };

    const inspections = await this.prisma.inspection.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc',
      },
      include: INSPECTION_INCLUDE,
    });

    return this.mapInspectionsToDto(inspections);
  }

  async findOne(
    id: string,
    filter: ApiaryUserFilter,
  ): Promise<InspectionResponse | null> {
    const inspection = await this.prisma.inspection.findFirst({
      where: {
        id,
        hive: {
          apiary: {
            id: filter.apiaryId,
          },
        },
      },
      include: INSPECTION_INCLUDE,
    });
    if (!inspection) {
      return null;
    }

    return this.mapInspectionsToDto([inspection])[0];
  }

  async update(
    id: string,
    updateInspectionDto: UpdateInspection,
    filter: ApiaryUserFilter,
  ): Promise<UpdateInspectionResponse> {
    this.logger.debug({ message: 'Updating inspection', updateInspectionDto });
    // Verify inspection exists and belongs to user's apiary
    const inspection = await this.prisma.inspection.findFirst({
      where: {
        id,
        hive: {
          apiary: {
            id: filter.apiaryId,
          },
        },
      },
      select: {
        id: true,
        status: true,
        hiveId: true,
        hive: {
          select: {
            apiary: {
              select: {
                settings: true,
              },
            },
          },
        },
      },
    });

    if (!inspection) {
      throw new NotFoundException(
        `Inspection with ID ${id} not found or doesn't belong to this apiary`,
      );
    }
    const {
      observations,
      notes,
      actions,
      score: scoreOverride,
      ...inspectionData
    } = updateInspectionDto;

    return this.prisma.$transaction(
      async (tx): Promise<UpdateInspectionResponse> => {
        if (observations !== undefined) {
          await tx.observation.deleteMany({
            where: {
              inspectionId: id,
            },
          });
        }

        if (notes !== undefined) {
          await tx.inspectionNote.deleteMany({
            where: {
              inspectionId: id,
            },
          });

          if (notes) {
            await tx.inspectionNote.create({
              data: {
                inspectionId: id,
                text: notes,
              },
            });
          }
        }

        if (actions !== undefined) {
          // Capture the previously applied frame delta before the existing
          // frame actions are replaced, then apply only the difference so the
          // brood-box frame counts are not double-counted on re-save.
          const previousFrameDelta = await this.getInspectionFrameDelta(tx, id);

          await this.actionsService.updateActions(
            id,
            actions,
            tx,
            filter.userId,
          );

          const nextFrameDelta = this.sumFrameActionDelta(actions);
          await this.applyFrameDeltaToBroodBoxes(
            tx,
            inspection.hiveId,
            nextFrameDelta - previousFrameDelta,
          );
        }

        const status = updateInspectionDto.status;
        const inspectionType = parseApiaryInspectionType(
          inspection.hive.apiary?.settings,
        );
        const calculatedScore =
          observations && inspectionType !== 'subjective'
            ? calculateScores(observations)
            : null;
        const scoreUpdateData = this.getScoreData(
          scoreOverride,
          calculatedScore,
          false,
        );

        const updateData: Prisma.InspectionUpdateInput = {
          ...inspectionData,
          status: status ?? inspection.status,
          ...scoreUpdateData,
        };

        if (observations !== undefined) {
          updateData.observations = {
            create: this.buildObservationRecords(observations),
          };
        }

        const updated = await tx.inspection.update({
          where: { id },
          data: updateData,
        });
        return {
          date: updated.date.toISOString(),
          id: updated.id,
          hiveId: updated.hiveId,
          isAllDay: updated.isAllDay,
          status: updated.status as InspectionStatus,
        };
      },
    );
  }

  async remove(id: string, filter: ApiaryUserFilter, revertFrames = false) {
    // Verify inspection exists and belongs to user's apiary
    const inspection = await this.prisma.inspection.findFirst({
      where: {
        id,
        hive: {
          apiary: {
            id: filter.apiaryId,
          },
        },
      },
    });

    if (!inspection) {
      throw new NotFoundException(
        `Inspection with ID ${id} not found or doesn't belong to this apiary`,
      );
    }

    // Delete files from S3 before transaction (outside DB transaction)
    await this.audioService.deleteAllForInspection(id);
    await this.photosService.deleteAllForInspection(id);

    return this.prisma.$transaction(async (tx) => {
      // Optionally revert this inspection's frame-count change before deleting
      // its actions, so the hive's brood-box frame counts stay consistent.
      if (revertFrames) {
        const appliedFrameDelta = await this.getInspectionFrameDelta(tx, id);
        if (appliedFrameDelta) {
          await this.applyFrameDeltaToBroodBoxes(
            tx,
            inspection.hiveId,
            -appliedFrameDelta,
          );
        }
      }

      // Delete related actions first
      await this.actionsService.deleteActions(id, tx);

      // Delete other related data
      await tx.observation.deleteMany({
        where: { inspectionId: id },
      });

      await tx.inspectionNote.deleteMany({
        where: { inspectionId: id },
      });

      // Audio records will be deleted by cascade

      // Delete the inspection
      await tx.inspection.delete({
        where: { id },
      });

      return `Inspection #${id} has been successfully removed`;
    });
  }

  async findOverdueInspections(
    filter: Partial<ApiaryUserFilter>,
  ): Promise<InspectionResponse[]> {
    await this.inspectionStatusUpdater.checkAndUpdateInspectionStatuses();

    const whereClause: Prisma.InspectionWhereInput = {
      status: InspectionStatus.OVERDUE,
      ...this.getApiaryFilter(filter),
    };

    const inspections = await this.prisma.inspection.findMany({
      where: whereClause,
      orderBy: {
        date: 'asc',
      },
      include: INSPECTION_INCLUDE,
    });

    return this.mapInspectionsToDto(inspections);
  }

  async findDueTodayInspections(
    filter: Partial<ApiaryUserFilter>,
  ): Promise<InspectionResponse[]> {
    await this.inspectionStatusUpdater.checkAndUpdateInspectionStatuses();

    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const tomorrow = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
    );

    const whereClause: Prisma.InspectionWhereInput = {
      status: InspectionStatus.SCHEDULED,
      date: {
        gte: today,
        lt: tomorrow,
      },
      ...this.getApiaryFilter(filter),
    };

    const inspections = await this.prisma.inspection.findMany({
      where: whereClause,
      orderBy: {
        date: 'asc',
      },
      include: INSPECTION_INCLUDE,
    });

    return this.mapInspectionsToDto(inspections);
  }

  private buildObservationRecords(observations: ObservationSchemaType) {
    return [
      { type: 'strength', numericValue: observations?.strength },
      {
        type: 'capped_brood',
        numericValue: observations?.cappedBrood,
      },
      {
        type: 'uncapped_brood',
        numericValue: observations?.uncappedBrood,
      },
      {
        type: 'honey_stores',
        numericValue: observations?.honeyStores,
      },
      {
        type: 'pollen_stores',
        numericValue: observations?.pollenStores,
      },
      { type: 'queen_cells', numericValue: observations?.queenCells },
      { type: 'swarm_cells', booleanValue: observations?.swarmCells },
      {
        type: 'supersedure_cells',
        booleanValue: observations?.supersedureCells,
      },
      { type: 'queen_seen', booleanValue: observations?.queenSeen },
      { type: 'total_frames', numericValue: observations?.totalFrames },
      { type: 'eggs_frames', numericValue: observations?.eggsFrames },
      {
        type: 'uncapped_brood_frames',
        numericValue: observations?.uncappedBroodFrames,
      },
      {
        type: 'capped_brood_frames',
        numericValue: observations?.cappedBroodFrames,
      },
      {
        type: 'drone_brood_frames',
        numericValue: observations?.droneBroodFrames,
      },
      { type: 'pollen_frames', numericValue: observations?.pollenFrames },
      { type: 'nectar_frames', numericValue: observations?.nectarFrames },
      { type: 'honey_frames', numericValue: observations?.honeyFrames },
      { type: 'empty_frames', numericValue: observations?.emptyFrames },
      { type: 'brood_pattern', textValue: observations?.broodPattern },
      ...(observations?.additionalObservations?.map((obs) => ({
        type: `additional_${obs}`,
        booleanValue: true,
      })) || []),
      ...(observations?.reminderObservations?.map((obs) => ({
        type: `reminder_${obs}`,
        booleanValue: true,
      })) || []),
    ];
  }

  private getScoreData(
    scoreOverride: Partial<ScoreResult> | undefined,
    calculatedScore: ScoreResult | null,
    clearScore = false,
  ) {
    if (clearScore) {
      return {
        overallScore: null,
        populationScore: null,
        storesScore: null,
        queenScore: null,
        scoreWarnings: null,
        scoreConfidence: null,
      };
    }

    const finalScore = scoreOverride
      ? {
          overallScore: scoreOverride.overallScore,
          populationScore: scoreOverride.populationScore,
          storesScore: scoreOverride.storesScore,
          queenScore: scoreOverride.queenScore,
          warnings: calculatedScore?.warnings ?? [],
          confidence: calculatedScore?.confidence ?? 0,
        }
      : calculatedScore;

    return finalScore
      ? {
          overallScore: finalScore.overallScore,
          populationScore: finalScore.populationScore,
          storesScore: finalScore.storesScore,
          queenScore: finalScore.queenScore,
          scoreWarnings: JSON.stringify(finalScore.warnings),
          scoreConfidence: finalScore.confidence,
        }
      : {};
  }

  private getApiaryFilter(filter: Partial<ApiaryUserFilter>) {
    if (!filter.apiaryId || !filter.userId) return {};
    return {
      hive: {
        apiary: {
          id: filter.apiaryId,
        },
      },
    };
  }

  private mapInspectionsToDto(
    inspections: InspectionWithIncludes[],
  ): InspectionResponse[] {
    return inspections.map((inspection): InspectionResponse => {
      const metrics = this.mapObservationsToDto(inspection.observations);
      const inspectionType = parseApiaryInspectionType(
        inspection.hive.apiary?.settings,
      );
      const score =
        inspectionType === 'subjective'
          ? undefined
          : getStoredOrCalculatedScore(
              inspection,
              metrics,
              (json: string) =>
                safeJsonParse(
                  json,
                  this.stringArraySchema,
                  this.winstonLogger,
                  'score warnings',
                ) ?? [],
            );

      const actions = inspection.actions.map((action) =>
        this.actionsService.mapPrismaToDto(action),
      );

      return {
        id: inspection.id,
        hiveId: inspection.hiveId,
        date: inspection.date.toISOString(),
        isAllDay: inspection.isAllDay,
        temperature: inspection.temperature ?? null,
        weatherConditions: inspection.weatherConditions ?? null,
        notes: inspection.notes?.[0]?.text ?? null,
        observations: metrics,
        status: inspection.status as InspectionStatus,
        score,
        actions,
        createdByUserName:
          inspection.createdByUser?.name || inspection.createdByUser?.email,
      };
    });
  }

  mapObservationsToDto(observations: Observation[]): ObservationSchemaType {
    const observationsByType: Record<string, Observation> = observations.reduce(
      (acc, observation) => ({
        ...acc,
        [observation.type]: observation,
      }),
      {},
    );

    // Extract additional observations (badges/tags)
    const additionalObservations = observations
      .filter((obs) => obs.type.startsWith('additional_') && obs.booleanValue)
      .map(
        (obs) =>
          obs.type.replace('additional_', '') as AdditionalObservationType,
      );

    // Extract reminder observations
    const reminderObservations = observations
      .filter((obs) => obs.type.startsWith('reminder_') && obs.booleanValue)
      .map(
        (obs) => obs.type.replace('reminder_', '') as ReminderObservationType,
      );

    return {
      strength: observationsByType.strength?.numericValue ?? null,
      uncappedBrood: observationsByType.uncapped_brood?.numericValue ?? null,
      cappedBrood: observationsByType.capped_brood?.numericValue ?? null,
      honeyStores: observationsByType.honey_stores?.numericValue ?? null,
      pollenStores: observationsByType.pollen_stores?.numericValue ?? null,
      queenCells: observationsByType.queen_cells?.numericValue ?? null,
      swarmCells: observationsByType.swarm_cells?.booleanValue ?? null,
      supersedureCells:
        observationsByType.supersedure_cells?.booleanValue ?? null,
      queenSeen: observationsByType.queen_seen?.booleanValue ?? null,

      // Frame count observations
      totalFrames: observationsByType.total_frames?.numericValue ?? null,
      eggsFrames: observationsByType.eggs_frames?.numericValue ?? null,
      uncappedBroodFrames:
        observationsByType.uncapped_brood_frames?.numericValue ?? null,
      cappedBroodFrames:
        observationsByType.capped_brood_frames?.numericValue ?? null,
      droneBroodFrames:
        observationsByType.drone_brood_frames?.numericValue ?? null,
      pollenFrames: observationsByType.pollen_frames?.numericValue ?? null,
      nectarFrames: observationsByType.nectar_frames?.numericValue ?? null,
      honeyFrames: observationsByType.honey_frames?.numericValue ?? null,
      emptyFrames: observationsByType.empty_frames?.numericValue ?? null,

      // New observation types
      broodPattern:
        (observationsByType.brood_pattern?.textValue as BroodPatternType) ??
        null,
      additionalObservations:
        additionalObservations.length > 0 ? additionalObservations : undefined,
      reminderObservations:
        reminderObservations.length > 0 ? reminderObservations : undefined,
    };
  }
}
