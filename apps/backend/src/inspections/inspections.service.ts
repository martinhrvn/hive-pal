import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { InspectionFilterDto } from './dto/inspection-filter.dto';
import { PrismaService } from '../prisma/prisma.service';
import { InspectionResponseDto } from './dto/inspection-response.dto';
import { InspectionMetricsDto } from './dto/inspection-metrics.dto';
import { Observation } from '@prisma/client';
import { MetricsService } from '../metrics/metrics.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';
import {
  Prisma,
  InspectionStatus as PrismaInspectionStatus,
} from '@prisma/client';
import { InspectionStatus } from './dto/inspection-status.enum';

@Injectable()
export class InspectionsService {
  constructor(
    private prisma: PrismaService,
    private metricService: MetricsService,
  ) {}

  async create(
    createInspectionDto: CreateInspectionDto,
    filter: ApiaryUserFilter,
  ) {
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
    const { observations, notes, ...inspectionData } = createInspectionDto;
    return this.prisma.$transaction(async (tx) => {
      const inspection = await tx.inspection.create({
        data: {
          ...inspectionData,
          status:
            createInspectionDto.date > new Date()
              ? PrismaInspectionStatus.SCHEDULED
              : PrismaInspectionStatus.COMPLETED,
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
              { type: 'honey_stores', numericValue: observations?.honeyStores },
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
            ],
          },
        },
        include: {
          observations: true,
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

      return inspection;
    });
  }

  async findAll(
    filter: InspectionFilterDto & Partial<ApiaryUserFilter>,
  ): Promise<InspectionResponseDto[]> {
    const whereClause: Prisma.InspectionWhereInput = {
      hiveId: filter.hiveId ?? undefined,
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
      },
    });
    return inspections.map((inspection): InspectionResponseDto => {
      const metrics = this.mapObservationsToDto(inspection.observations);
      const score = this.metricService.calculateOveralScore(metrics);
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
      };
    });
  }

  async findOne(
    id: string,
    filter: ApiaryUserFilter,
  ): Promise<InspectionResponseDto | null> {
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
      },
    });
    if (!inspection) {
      return null;
    }
    const metrics = this.mapObservationsToDto(inspection.observations);
    const score = this.metricService.calculateOveralScore(metrics);
    return {
      ...inspection,
      date: inspection.date.toISOString(),
      notes: inspection.notes?.[0]?.text ?? null,
      observations: metrics,
      status: inspection.status as InspectionStatus,
      score,
    };
  }

  async update(
    id: string,
    updateInspectionDto: UpdateInspectionDto,
    filter: ApiaryUserFilter,
  ) {
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
    const { observations, notes, ...inspectionData } = updateInspectionDto;
    return this.prisma.$transaction(async (tx) => {
      await tx.observation.deleteMany({
        where: {
          inspectionId: id,
        },
      });

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

      return await tx.inspection.update({
        where: { id },
        data: {
          ...inspectionData,
          hiveId: inspection.hiveId,
          status: updateInspectionDto.status ?? inspection.status,
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
              { type: 'honey_stores', numericValue: observations?.honeyStores },
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
            ],
          },
        },
      });
    });
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

    // Delete the inspection
    await this.prisma.inspection.delete({
      where: { id },
    });

    return `Inspection #${id} has been successfully removed`;
  }

  mapObservationsToDto(observations: Observation[]): InspectionMetricsDto {
    const observationsByType: Record<string, Observation> = observations.reduce(
      (acc, observation) => ({
        ...acc,
        [observation.type]: observation,
      }),
      {},
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
    };
  }
}
