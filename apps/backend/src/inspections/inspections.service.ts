import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { Observation, Prisma } from '@prisma/client';
import { MetricsService } from '../metrics/metrics.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';
import { ActionsService } from '../actions/actions.service';
import { CustomLoggerService } from '../logger/logger.service';
import { InspectionCreatedEvent } from '../events/hive.events';
import { InspectionStatusUpdaterService } from './inspection-status-updater.service';
import { InspectionAudioService } from '../inspection-audio/inspection-audio.service';

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
      };
    };
    hive: {
      select: {
        name: true;
      };
    };
  };
}>;
import {
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
} from 'shared-schemas';

@Injectable()
export class InspectionsService {
  constructor(
    private prisma: PrismaService,
    private metricService: MetricsService,
    private actionsService: ActionsService,
    private logger: CustomLoggerService,
    private eventEmitter: EventEmitter2,
    private inspectionStatusUpdater: InspectionStatusUpdaterService,
    @Inject(forwardRef(() => InspectionAudioService))
    private audioService: InspectionAudioService,
  ) {}

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
          userId: filter.userId,
        },
      },
    });

    if (!hive) {
      throw new NotFoundException(
        `Hive with ID ${createInspectionDto.hiveId} not found or doesn't belong to this apiary`,
      );
    }
    const { observations, notes, actions, ...inspectionData } =
      createInspectionDto;

    return this.prisma.$transaction(
      async (tx): Promise<CreateInspectionResponse> => {
        // Default status: future date -> PENDING, otherwise DONE
        // If status was explicitly provided, use that instead
        const status =
          createInspectionDto.status ||
          (new Date(createInspectionDto.date) > new Date()
            ? 'SCHEDULED'
            : 'COMPLETED');

        const inspection = await tx.inspection.create({
          data: {
            ...inspectionData,
            status: status,
            observations: {
              create: [
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

                // New observation types
                {
                  type: 'brood_pattern',
                  textValue: observations?.broodPattern,
                },

                // Additional observations (badges/tags)
                ...(observations?.additionalObservations?.map((obs) => ({
                  type: `additional_${obs}`,
                  booleanValue: true,
                })) || []),

                // Reminder observations
                ...(observations?.reminderObservations?.map((obs) => ({
                  type: `reminder_${obs}`,
                  booleanValue: true,
                })) || []),
              ],
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
          await this.actionsService.createActions(inspection.id, actions, tx);
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
    // Update any overdue inspection statuses before fetching
    await this.inspectionStatusUpdater.checkAndUpdateInspectionStatuses();

    const whereClause: Prisma.InspectionWhereInput = {
      hiveId: filter.hiveId ?? undefined,
      // Add date filtering
      ...(filter.startDate || filter.endDate
        ? {
            date: {
              ...(filter.startDate && { gte: new Date(filter.startDate) }),
              ...(filter.endDate && { lte: new Date(filter.endDate) }),
            },
          }
        : {}),
    };

    // Add apiary filter if provided
    if (filter.apiaryId && filter.userId) {
      whereClause.hive = {
        apiary: {
          id: filter.apiaryId,
          userId: filter.userId,
        },
      };
    }

    const inspections = await this.prisma.inspection.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc',
      },
      include: {
        observations: true,
        notes: true,
        actions: {
          include: {
            feedingAction: true,
            treatmentAction: true,
            frameAction: true,
            harvestAction: true,
            boxConfigurationAction: true,
          },
        },
      },
    });

    return inspections.map((inspection): InspectionResponse => {
      const metrics = this.mapObservationsToDto(inspection.observations);
      const score = this.metricService.calculateOveralScore(metrics);

      // Transform actions to DTOs - with explicit casting of the type
      const actions = inspection.actions.map((action) =>
        this.actionsService.mapPrismaToDto(action),
      );

      return {
        id: inspection.id,
        hiveId: inspection.hiveId,
        date: inspection.date.toISOString(),
        temperature: inspection.temperature ?? null,
        weatherConditions: inspection.weatherConditions ?? null,
        notes: inspection.notes?.[0]?.text ?? null,
        observations: metrics,
        status: inspection.status as InspectionStatus,
        score,
        actions,
      };
    });
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
            userId: filter.userId,
          },
        },
      },
      include: {
        observations: true,
        notes: true,
        actions: {
          include: {
            feedingAction: true,
            treatmentAction: true,
            frameAction: true,
            harvestAction: true,
            boxConfigurationAction: true,
          },
        },
      },
    });
    if (!inspection) {
      return null;
    }

    const metrics = this.mapObservationsToDto(inspection.observations);
    const score = this.metricService.calculateOveralScore(metrics);

    // Transform actions to DTOs - with explicit casting of the type

    const actions = inspection.actions.map((action) =>
      this.actionsService.mapPrismaToDto(action),
    );
    return {
      id: inspection.id,
      hiveId: inspection.hiveId,
      date: inspection.date.toISOString(),
      temperature: inspection.temperature ?? null,
      weatherConditions: inspection.weatherConditions ?? null,
      notes: inspection.notes?.[0]?.text ?? null,
      observations: metrics,
      status: inspection.status as InspectionStatus,
      score,
      actions,
    };
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
            userId: filter.userId,
          },
        },
      },
    });

    if (!inspection) {
      throw new NotFoundException(
        `Inspection with ID ${id} not found or doesn't belong to this apiary`,
      );
    }
    const { observations, notes, actions, ...inspectionData } =
      updateInspectionDto;

    return this.prisma.$transaction(
      async (tx): Promise<UpdateInspectionResponse> => {
        // Handle observations update only if provided
        if (observations !== undefined) {
          await tx.observation.deleteMany({
            where: {
              inspectionId: id,
            },
          });
        }

        // Handle notes update
        if (notes !== undefined) {
          // Delete existing notes
          await tx.inspectionNote.deleteMany({
            where: {
              inspectionId: id,
            },
          });

          // Create new note if there's content
          if (notes) {
            await tx.inspectionNote.create({
              data: {
                inspectionId: id,
                text: notes,
              },
            });
          }
        }

        // Handle actions update if provided - use ActionsService
        if (actions !== undefined) {
          await this.actionsService.updateActions(id, actions, tx);
        }

        // Determine status based on explicit input or date-based default
        const status = updateInspectionDto.status;

        // Prepare update data - only include observations if they were provided
        const updateData: Prisma.InspectionUpdateInput = {
          ...inspectionData,
          status: status ?? inspection.status,
        };

        // Only add observations to update if they were provided
        if (observations !== undefined) {
          updateData.observations = {
            create: [
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

              // New observation types
              { type: 'brood_pattern', textValue: observations?.broodPattern },

              // Additional observations (badges/tags)
              ...(observations?.additionalObservations?.map((obs) => ({
                type: `additional_${obs}`,
                booleanValue: true,
              })) || []),

              // Reminder observations
              ...(observations?.reminderObservations?.map((obs) => ({
                type: `reminder_${obs}`,
                booleanValue: true,
              })) || []),
            ],
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
          status: updated.status as InspectionStatus,
        };
      },
    );
  }

  async remove(id: string, filter: ApiaryUserFilter) {
    // Verify inspection exists and belongs to user's apiary
    const inspection = await this.prisma.inspection.findFirst({
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

    if (!inspection) {
      throw new NotFoundException(
        `Inspection with ID ${id} not found or doesn't belong to this apiary`,
      );
    }

    // Delete audio files from S3 before transaction (outside DB transaction)
    await this.audioService.deleteAllForInspection(id);

    return this.prisma.$transaction(async (tx) => {
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
    // Update any overdue inspection statuses before fetching
    await this.inspectionStatusUpdater.checkAndUpdateInspectionStatuses();

    const whereClause: Prisma.InspectionWhereInput = {
      status: InspectionStatus.OVERDUE,
    };

    // Add apiary filter if provided
    if (filter.apiaryId && filter.userId) {
      whereClause.hive = {
        apiary: {
          id: filter.apiaryId,
          userId: filter.userId,
        },
      };
    }

    const inspections = await this.prisma.inspection.findMany({
      where: whereClause,
      orderBy: {
        date: 'asc', // Oldest overdue first
      },
      include: {
        observations: true,
        notes: true,
        actions: {
          include: {
            feedingAction: true,
            treatmentAction: true,
            frameAction: true,
            harvestAction: true,
            boxConfigurationAction: true,
          },
        },
        hive: {
          select: {
            name: true,
          },
        },
      },
    });

    return this.mapInspectionsToDto(inspections);
  }

  async findDueTodayInspections(
    filter: Partial<ApiaryUserFilter>,
  ): Promise<InspectionResponse[]> {
    // Update any overdue inspection statuses before fetching
    await this.inspectionStatusUpdater.checkAndUpdateInspectionStatuses();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereClause: Prisma.InspectionWhereInput = {
      status: InspectionStatus.SCHEDULED,
      date: {
        gte: today,
        lt: tomorrow,
      },
    };

    // Add apiary filter if provided
    if (filter.apiaryId && filter.userId) {
      whereClause.hive = {
        apiary: {
          id: filter.apiaryId,
          userId: filter.userId,
        },
      };
    }

    const inspections = await this.prisma.inspection.findMany({
      where: whereClause,
      orderBy: {
        date: 'asc',
      },
      include: {
        observations: true,
        notes: true,
        actions: {
          include: {
            feedingAction: true,
            treatmentAction: true,
            frameAction: true,
            harvestAction: true,
            boxConfigurationAction: true,
          },
        },
        hive: {
          select: {
            name: true,
          },
        },
      },
    });

    return this.mapInspectionsToDto(inspections);
  }

  private mapInspectionsToDto(
    inspections: InspectionWithIncludes[],
  ): InspectionResponse[] {
    return inspections.map((inspection): InspectionResponse => {
      const metrics = this.mapObservationsToDto(inspection.observations);
      const score = this.metricService.calculateOveralScore(metrics);

      // Transform actions to DTOs - with explicit casting of the type
      const actions = inspection.actions.map((action) =>
        this.actionsService.mapPrismaToDto(action),
      );

      return {
        id: inspection.id,
        hiveId: inspection.hiveId,
        date: inspection.date.toISOString(),
        temperature: inspection.temperature ?? null,
        weatherConditions: inspection.weatherConditions ?? null,
        notes: inspection.notes?.[0]?.text ?? null,
        observations: metrics,
        status: inspection.status as InspectionStatus,
        score,
        actions,
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
      queenSeen: observationsByType.queen_seen?.booleanValue ?? false,

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
