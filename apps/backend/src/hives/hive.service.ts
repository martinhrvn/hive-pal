import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHiveDto } from './dto/create-hive.dto';
import { UpdateHiveDto } from './dto/update-hive.dto';

@Injectable()
export class HiveService {
  constructor(private prisma: PrismaService) {}

  create(createHiveDto: CreateHiveDto) {
    return this.prisma.hive.create({
      data: createHiveDto,
    });
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

  // Calculate current state based on actions
  async calculateCurrentState(id: string) {
    const hive = await this.prisma.hive.findUnique({
      where: { id },
      include: {
        inspections: {
          orderBy: {
            date: 'asc',
          },
          include: {
            observations: true,
            actions: true,
          },
        },
      },
    });

    if (!hive) return null;

    const state = {
      superCount: 0,
      lastFeeding: null,
      lastTreatment: null,
    };

    for (const inspection of hive.inspections) {
      for (const action of inspection.actions) {
        switch (action.type) {
          case 'SUPER_ADDED':
            state.superCount += action.value as number;
            break;
          case 'SUPER_REMOVED':
            state.superCount -= action.value as number;
            break;
          case 'FEEDING':
            state.lastFeeding = inspection.date;
            break;
          case 'TREATMENT':
            state.lastTreatment = inspection.date;
            break;
        }
      }

      // State verification from observations
      const superCountObs = inspection.observations.find(
        (obs) => obs.type === 'SUPER_COUNT',
      );
      if (superCountObs) {
        state.superCount = superCountObs.value as number;
      }
    }

    return state;
  }
}
