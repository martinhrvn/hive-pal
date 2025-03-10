import { Injectable } from '@nestjs/common';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { InspectionFilterDto } from './dto/inspection-filter.dto';
import { PrismaService } from '../prisma/prisma.service';
import { InspectionResponseDto } from './dto/inspection-response.dto';
import { InspectionMetricsDto } from './dto/inspection-metrics.dto';
import { HiveMetric, Observation, Prisma } from '@prisma/client';
import { MetricsService } from '../metrics/metrics.service';
import { InspectionScoreDto } from './dto/inspection-score.dto';

@Injectable()
export class InspectionsService {
  constructor(
    private prisma: PrismaService,
    private metricService: MetricsService,
  ) {}

  create(createInspectionDto: CreateInspectionDto) {
    const { observations, ...inspectionData } = createInspectionDto;
    return this.prisma.$transaction(async (tx) => {
      const inspection = await tx.inspection.create({
        data: {
          ...inspectionData,
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
      await this.storeHiveMetrics(inspection.id, createInspectionDto, tx);
    });
  }

  async findAll(filter: InspectionFilterDto): Promise<InspectionResponseDto[]> {
    const inspections = await this.prisma.inspection.findMany({
      where: {
        hiveId: filter.hiveId ?? undefined,
      },
      orderBy: {
        date: 'desc',
      },
      include: {
        observations: true,
        hiveMetric: true,
      },
    });
    return inspections.map((inspection): InspectionResponseDto => {
      return {
        id: inspection.id,
        hiveId: inspection.hiveId,
        date: inspection.date.toISOString(),
        temperature: inspection.temperature ?? null,
        weatherConditions: inspection.weatherConditions ?? null,
        observations: this.mapObservationsToDto(inspection.observations),
        score: {
          queenScore: inspection.hiveMetric?.queenRating ?? null,
          storesScore: inspection.hiveMetric?.storesRating ?? null,
          populationScore: inspection.hiveMetric?.populationRating ?? null,
          overallScore: inspection.hiveMetric?.overallRating ?? null,
          warnings: inspection.hiveMetric?.warnings ?? [],
        },
      };
    });
  }

  async findOne(id: string): Promise<InspectionResponseDto | null> {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: {
        observations: true,
        hiveMetric: true,
      },
    });
    if (!inspection) {
      return null;
    }
    return {
      ...inspection,
      date: inspection.date.toISOString(),
      observations: this.mapObservationsToDto(inspection.observations),
      score: this.mapHiveMetricsToDto(inspection.hiveMetric),
    };
  }

  update(id: string, updateInspectionDto: UpdateInspectionDto) {
    const { observations, ...inspectionData } = updateInspectionDto;
    return this.prisma.$transaction(async (tx) => {
      await tx.observation.deleteMany({
        where: {
          inspectionId: id,
        },
      });
      return tx.inspection.update({
        where: { id },
        data: {
          ...inspectionData,
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

  remove(id: string) {
    return `This action removes a #${id} inspection`;
  }

  private mapObservationsToDto(
    observations: Observation[],
  ): InspectionMetricsDto {
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

  async storeHiveMetrics(
    inspectionId: string,
    inspection: CreateInspectionDto,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx ?? this.prisma;
    const overallRating = this.metricService.calculateOveralScore(
      inspection.observations ?? {},
    );
    await prisma.hiveMetric.create({
      data: {
        hiveId: inspection.hiveId,
        inspectionId: inspectionId,
        date: inspection.date,
        overallRating: overallRating.overallScore,
        populationRating: overallRating.populationScore,
        storesRating: overallRating.storesScore,
        queenRating: overallRating.queenScore,
        cappedBrood: inspection.observations?.cappedBrood,
        uncappedBrood: inspection.observations?.uncappedBrood,
        honeyStores: inspection.observations?.honeyStores,
        pollenStores: inspection.observations?.pollenStores,
        queenSeen: inspection.observations?.queenSeen,
        queenCells: inspection.observations?.queenCells,
        swarmCells: inspection.observations?.swarmCells ?? false,
        supersedureCells: inspection.observations?.supersedureCells ?? false,
        warnings: overallRating.warnings,
      },
    });
  }

  mapHiveMetricsToDto(hiveMetrics: HiveMetric | null): InspectionScoreDto {
    return {
      overallScore: hiveMetrics?.overallRating ?? null,
      populationScore: hiveMetrics?.populationRating ?? null,
      storesScore: hiveMetrics?.storesRating ?? null,
      queenScore: hiveMetrics?.queenRating ?? null,
      warnings: hiveMetrics?.warnings ?? [],
    };
  }
}
