import { Injectable } from '@nestjs/common';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { InspectionFilterDto } from './dto/inspection-filter.dto';
import { PrismaService } from '../prisma/prisma.service';
import { InspectionResponseDto } from './dto/inspection-response.dto';
import { ObservationResponseDto } from './dto/observation-response.dto';
import { Observation } from '@prisma/client';

@Injectable()
export class InspectionsService {
  constructor(private prisma: PrismaService) {}

  create(createInspectionDto: CreateInspectionDto) {
    const { observations, ...inspectionData } = createInspectionDto;
    return this.prisma.inspection.create({
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
            { type: 'pollen_stores', numericValue: observations?.pollenStores },
            { type: 'queen_cells', numericValue: observations?.queenCells },
            { type: 'swarm_cells', numericValue: observations?.swarmCells },
            {
              type: 'supersedure_cells',
              numericValue: observations?.supersedureCells,
            },
            { type: 'queen_seen', booleanValue: observations?.queenSeen },
          ],
        },
      },
      include: {
        observations: true,
      },
    });
  }

  async findAll(filter: InspectionFilterDto): Promise<InspectionResponseDto[]> {
    const inspections = await this.prisma.inspection.findMany({
      where: {
        hiveId: filter.hiveId ?? undefined,
      },
      include: {
        observations: true,
      },
    });
    return inspections.map((inspection): InspectionResponseDto => {
      const observationsByType: Record<string, Observation> =
        inspection.observations.reduce(
          (acc, observation) => ({
            ...acc,
            [observation.type]: observation,
          }),
          {},
        );
      const observations: ObservationResponseDto = {
        strength: observationsByType.strength?.numericValue ?? null,
        uncappedBrood: observationsByType.uncapped_brood?.numericValue ?? null,
        cappedBrood: observationsByType.capped_brood?.numericValue ?? null,
        honeyStores: observationsByType.honey_stores?.numericValue ?? null,
        pollenStores: observationsByType.pollen_stores?.numericValue ?? null,
        queenCells: observationsByType.queen_cells?.numericValue ?? null,
        swarmCells: observationsByType.swarm_cells?.numericValue ?? null,
        supersedureCells:
          observationsByType.supersedure_cells?.numericValue ?? null,
        queenSeen: observationsByType.queen_seen?.booleanValue ?? false,
      };
      return {
        id: inspection.id,
        hiveId: inspection.hiveId,
        date: inspection.date.toISOString(),
        temperature: inspection.temperature ?? null,
        weatherConditions: inspection.weatherConditions ?? null,
        observations: observations,
      };
    });
  }

  findOne(id: string) {
    return this.prisma.inspection.findUnique({
      where: { id },
      include: {
        observations: true,
      },
    });
  }

  update(id: string, updateInspectionDto: UpdateInspectionDto) {
    return `This action updates a #${id} inspection`;
  }

  remove(id: string) {
    return `This action removes a #${id} inspection`;
  }
}
