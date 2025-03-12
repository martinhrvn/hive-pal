import { Injectable } from '@nestjs/common';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { InspectionFilterDto } from './dto/inspection-filter.dto';
import { PrismaService } from '../prisma/prisma.service';
import { InspectionResponseDto } from './dto/inspection-response.dto';
import { InspectionMetricsDto } from './dto/inspection-metrics.dto';
import { Observation } from '@prisma/client';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class InspectionsService {
  constructor(
    private prisma: PrismaService,
    private metricService: MetricsService,
  ) {}

  create(createInspectionDto: CreateInspectionDto) {
    const { observations, ...inspectionData } = createInspectionDto;
    return this.prisma.$transaction(async (tx) => {
      await tx.inspection.create({
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
        observations: metrics,
        score,
      };
    });
  }

  async findOne(id: string): Promise<InspectionResponseDto | null> {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: {
        observations: true,
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
      observations: metrics,
      score,
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

      return await tx.inspection.update({
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
