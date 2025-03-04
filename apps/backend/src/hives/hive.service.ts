import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHiveDto } from './dto/create-hive.dto';
import { UpdateHiveDto } from './dto/update-hive.dto';
import { HiveResponseDto } from './dto/hive-response.dto';
import { plainToInstance } from 'class-transformer';
import { mapPrismaHiveStatusToDto } from './dto/hive-status.enum';

@Injectable()
export class HiveService {
  constructor(private prisma: PrismaService) {}

  async create(createHiveDto: CreateHiveDto): Promise<HiveResponseDto> {
    const hive = await this.prisma.hive.create({
      data: createHiveDto,
    });
    return {
      id: hive.id,
      name: hive.name,
      apiaryId: hive.apiaryId,
      status: mapPrismaHiveStatusToDto(hive.status),
      notes: hive.notes,
      installationDate: hive.installationDate?.toISOString() ?? '',
      lastInspectionDate: null,
    };
  }

  async findAll(): Promise<HiveResponseDto[]> {
    const hives = await this.prisma.hive.findMany({
      include: {
        inspections: {
          select: {
            date: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 1,
        },
      },
    });

    return hives.map((hive) =>
      plainToInstance(HiveResponseDto, {
        id: hive.id,
        name: hive.name,
        apiaryId: hive.apiaryId,
        status: mapPrismaHiveStatusToDto(hive.status),
        notes: hive.notes,
        installationDate: hive.installationDate?.toISOString() ?? '',
        lastInspectionDate: hive.inspections[0]?.date?.toISOString() ?? '',
      }),
    );
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
