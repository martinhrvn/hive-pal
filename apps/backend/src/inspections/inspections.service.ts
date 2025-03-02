import { Injectable } from '@nestjs/common';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { InspectionFilterDto } from './dto/inspection-filter.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InspectionsService {
  constructor(private prisma: PrismaService) {}

  create(createInspectionDto: CreateInspectionDto) {
    return this.prisma.inspection.create({
      data: createInspectionDto,
    });
  }

  findAll(filter: InspectionFilterDto) {
    return this.prisma.inspection.findMany({
      where: {
        ...(filter.hiveId && { hiveId: filter.hiveId }),
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} inspection`;
  }

  update(id: number, updateInspectionDto: UpdateInspectionDto) {
    return `This action updates a #${id} inspection`;
  }

  remove(id: number) {
    return `This action removes a #${id} inspection`;
  }
}
