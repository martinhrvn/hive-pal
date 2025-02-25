import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHiveDto } from './dto/create-hive.dto';
import { UpdateHiveDto } from './dto/update-hive.dto';

@Injectable()
export class HiveService {
  constructor(private prisma: PrismaService) {}

  async create(createHiveDto: CreateHiveDto) {
    const hive = await this.prisma.hive.create({
      data: createHiveDto,
    });
    return {
      id: hive.id,
      name: hive.name,
      apiaryId: hive.apiaryId,
      notes: hive.notes,
      installationDate: hive.installationDate?.toISOString() ?? '',
      lastInspectionDate: null,
    };
  }

  findAll() {
    return this.prisma.hive.findMany({
      include: {
        apiary: true,
        queens: {
          where: {
            status: 'ACTIVE',
          },
          take: 1,
        },
        inspections: {
          take: 1,
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
  }

  findOne(id: string) {
    return this.prisma.hive.findUnique({
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
  }

  update(id: string, updateHiveDto: UpdateHiveDto) {
    return this.prisma.hive.update({
      where: { id },
      data: updateHiveDto,
    });
  }

  remove(id: string) {
    return this.prisma.hive.delete({
      where: { id },
    });
  }
}
