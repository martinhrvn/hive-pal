import { Injectable } from '@nestjs/common';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { InspectionFilterDto } from './dto/inspection-filter.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InspectionsService {
  constructor(private prisma: PrismaService) {}

  create(createInspectionDto: CreateInspectionDto) {
    const { observations, ...inspectionData } = createInspectionDto;

    return this.prisma.inspection.create({
      data: {
        ...inspectionData,
        observations: observations
          ? {
              create: observations.map((observation) => ({
                type: observation.type,
                numericValue: observation.numericValue,
                textValue: observation.textValue,
                notes: observation.notes,
              })),
            }
          : undefined,
      },
      include: {
        observations: true,
      },
    });
  }

  findAll(filter: InspectionFilterDto) {
    return this.prisma.inspection.findMany({
      where: {
        ...(filter.hiveId && { hiveId: filter.hiveId }),
      },
      include: {
        observations: true,
      },
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
