import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActionsService } from '../actions/actions.service';
import {
  CreateHarvest,
  UpdateHarvest,
  SetHarvestWeight,
  HarvestResponse,
  HarvestListResponse,
  HarvestFilter,
  HarvestStatus,
  ActionType,
} from 'shared-schemas';
import { Prisma } from '@prisma/client';

@Injectable()
export class HarvestsService {
  constructor(
    private prisma: PrismaService,
    private actionsService: ActionsService,
  ) {}

  async create(
    apiaryId: string,
    userId: string,
    createHarvestDto: CreateHarvest,
  ): Promise<HarvestResponse> {
    // Verify the apiary belongs to the user
    const apiary = await this.prisma.apiary.findFirst({
      where: {
        id: apiaryId,
        userId,
      },
    });

    if (!apiary) {
      throw new ForbiddenException('Apiary not found or access denied');
    }

    // Verify all hives belong to the apiary
    const hiveIds = createHarvestDto.harvestHives.map((hh) => hh.hiveId);
    const hives = await this.prisma.hive.findMany({
      where: {
        id: { in: hiveIds },
        apiaryId,
      },
    });

    if (hives.length !== hiveIds.length) {
      throw new BadRequestException(
        'One or more hives not found in this apiary',
      );
    }

    // Create the harvest with hives
    const harvest = await this.prisma.harvest.create({
      data: {
        apiaryId,
        date: new Date(createHarvestDto.date),
        notes: createHarvestDto.notes,
        status: HarvestStatus.DRAFT,
        harvestHives: {
          create: createHarvestDto.harvestHives.map((hh) => ({
            hiveId: hh.hiveId,
            framesTaken: hh.framesTaken,
          })),
        },
      },
      include: {
        harvestHives: {
          include: {
            hive: true,
          },
        },
      },
    });

    return this.mapToResponse(harvest);
  }

  async update(
    harvestId: string,
    userId: string,
    updateHarvestDto: UpdateHarvest,
  ): Promise<HarvestResponse> {
    // Get the harvest and verify ownership
    const harvest = await this.prisma.harvest.findFirst({
      where: {
        id: harvestId,
        apiary: {
          userId,
        },
      },
    });

    if (!harvest) {
      throw new NotFoundException('Harvest not found or access denied');
    }

    if (harvest.status === HarvestStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot edit completed harvest. Reopen it first.',
      );
    }

    // Update harvest
    const updatedHarvest = await this.prisma.$transaction(async (tx) => {
      // Update main harvest fields
      await tx.harvest.update({
        where: { id: harvestId },
        data: {
          date: updateHarvestDto.date
            ? new Date(updateHarvestDto.date)
            : undefined,
          notes: updateHarvestDto.notes,
          totalWeight: updateHarvestDto.totalWeight
            ? Math.round(updateHarvestDto.totalWeight * 10) / 10
            : undefined,
        },
      });

      // Update harvest hives if provided
      if (updateHarvestDto.harvestHives) {
        // Delete existing harvest hives
        await tx.harvestHive.deleteMany({
          where: { harvestId },
        });

        // Create new harvest hives
        await tx.harvestHive.createMany({
          data: updateHarvestDto.harvestHives.map((hh) => ({
            harvestId,
            hiveId: hh.hiveId,
            framesTaken: hh.framesTaken,
          })),
        });
      }

      // If total weight is set, calculate distribution
      if (updateHarvestDto.totalWeight) {
        await this.calculateHoneyDistribution(harvestId, tx);
      }

      return await tx.harvest.findUnique({
        where: { id: harvestId },
        include: {
          harvestHives: {
            include: {
              hive: true,
            },
          },
        },
      });
    });

    if (!updatedHarvest) {
      throw new Error('Failed to update harvest');
    }

    return this.mapToResponse(updatedHarvest);
  }

  async setWeight(
    harvestId: string,
    userId: string,
    setWeightDto: SetHarvestWeight,
  ): Promise<HarvestResponse> {
    // Get the harvest and verify ownership
    const harvest = await this.prisma.harvest.findFirst({
      where: {
        id: harvestId,
        apiary: {
          userId,
        },
      },
    });

    if (!harvest) {
      throw new NotFoundException('Harvest not found or access denied');
    }

    if (harvest.status === HarvestStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot edit completed harvest. Reopen it first.',
      );
    }

    // Update weight and calculate distribution
    const updatedHarvest = await this.prisma.$transaction(async (tx) => {
      // Update harvest weight and status
      await tx.harvest.update({
        where: { id: harvestId },
        data: {
          totalWeight: Math.round(setWeightDto.totalWeight * 10) / 10,
          status: HarvestStatus.IN_PROGRESS,
        },
      });

      // Calculate honey distribution
      await this.calculateHoneyDistribution(harvestId, tx);

      return await tx.harvest.findUnique({
        where: { id: harvestId },
        include: {
          harvestHives: {
            include: {
              hive: true,
            },
          },
        },
      });
    });

    if (!updatedHarvest) {
      throw new Error('Failed to set harvest weight');
    }

    return this.mapToResponse(updatedHarvest);
  }

  async finalize(harvestId: string, userId: string): Promise<HarvestResponse> {
    // Get the harvest and verify ownership
    const harvest = await this.prisma.harvest.findFirst({
      where: {
        id: harvestId,
        apiary: {
          userId,
        },
      },
      include: {
        harvestHives: true,
      },
    });

    if (!harvest) {
      throw new NotFoundException('Harvest not found or access denied');
    }

    if (harvest.status === HarvestStatus.COMPLETED) {
      throw new BadRequestException('Harvest is already completed');
    }

    if (!harvest.totalWeight || harvest.totalWeight === 0) {
      throw new BadRequestException(
        'Cannot finalize harvest without total weight',
      );
    }

    // Finalize harvest and create actions
    const finalizedHarvest = await this.prisma.$transaction(async (tx) => {
      // Create harvest actions for each hive
      for (const harvestHive of harvest.harvestHives) {
        if (harvestHive.honeyAmount && harvestHive.honeyAmount > 0) {
          const action = await tx.action.create({
            data: {
              hiveId: harvestHive.hiveId,
              harvestId,
              type: ActionType.HARVEST,
              date: harvest.date,
              notes: `Harvested ${harvestHive.honeyAmount.toFixed(
                1,
              )} kg of honey (${harvestHive.framesTaken} frames)`,
            },
          });

          await tx.harvestAction.create({
            data: {
              actionId: action.id,
              amount: harvestHive.honeyAmount,
              unit: 'kg',
            },
          });
        }
      }

      // Update harvest status
      await tx.harvest.update({
        where: { id: harvestId },
        data: {
          status: HarvestStatus.COMPLETED,
        },
      });

      return await tx.harvest.findUnique({
        where: { id: harvestId },
        include: {
          harvestHives: {
            include: {
              hive: true,
            },
          },
        },
      });
    });

    if (!finalizedHarvest) {
      throw new Error('Failed to finalize harvest');
    }

    return this.mapToResponse(finalizedHarvest);
  }

  async reopen(harvestId: string, userId: string): Promise<HarvestResponse> {
    // Get the harvest and verify ownership
    const harvest = await this.prisma.harvest.findFirst({
      where: {
        id: harvestId,
        apiary: {
          userId,
        },
      },
    });

    if (!harvest) {
      throw new NotFoundException('Harvest not found or access denied');
    }

    if (harvest.status !== HarvestStatus.COMPLETED) {
      throw new BadRequestException('Only completed harvests can be reopened');
    }

    // Reopen harvest and delete associated actions
    const reopenedHarvest = await this.prisma.$transaction(async (tx) => {
      // Get all actions for this harvest
      const actions = await tx.action.findMany({
        where: { harvestId },
        select: { id: true },
      });

      // Delete harvest action details
      for (const action of actions) {
        await tx.harvestAction.deleteMany({
          where: { actionId: action.id },
        });
      }

      // Delete actions
      await tx.action.deleteMany({
        where: { harvestId },
      });

      // Update harvest status
      await tx.harvest.update({
        where: { id: harvestId },
        data: {
          status: HarvestStatus.IN_PROGRESS,
        },
      });

      return await tx.harvest.findUnique({
        where: { id: harvestId },
        include: {
          harvestHives: {
            include: {
              hive: true,
            },
          },
        },
      });
    });

    if (!reopenedHarvest) {
      throw new Error('Failed to reopen harvest');
    }

    return this.mapToResponse(reopenedHarvest);
  }

  async findOne(harvestId: string, userId: string): Promise<HarvestResponse> {
    const harvest = await this.prisma.harvest.findFirst({
      where: {
        id: harvestId,
        apiary: {
          userId,
        },
      },
      include: {
        harvestHives: {
          include: {
            hive: true,
          },
        },
      },
    });

    if (!harvest) {
      throw new NotFoundException('Harvest not found or access denied');
    }

    return this.mapToResponse(harvest);
  }

  async findAll(
    userId: string,
    filter: HarvestFilter,
  ): Promise<HarvestListResponse[]> {
    const whereClause: Prisma.HarvestWhereInput = {
      apiary: {
        userId,
        ...(filter.apiaryId && { id: filter.apiaryId }),
      },
      ...(filter.status && { status: filter.status }),
      ...(filter.startDate || filter.endDate
        ? {
            date: {
              ...(filter.startDate && { gte: new Date(filter.startDate) }),
              ...(filter.endDate && { lte: new Date(filter.endDate) }),
            },
          }
        : {}),
    };

    const harvests = await this.prisma.harvest.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        harvestHives: true,
      },
    });

    return harvests.map((harvest) => ({
      id: harvest.id,
      apiaryId: harvest.apiaryId,
      date: harvest.date.toISOString(),
      status: harvest.status as HarvestStatus,
      totalWeight: harvest.totalWeight ?? undefined,
      hiveCount: harvest.harvestHives.length,
      totalFrames: harvest.harvestHives.reduce(
        (sum, hh) => sum + hh.framesTaken,
        0,
      ),
      createdAt: harvest.createdAt.toISOString(),
    }));
  }

  async delete(harvestId: string, userId: string): Promise<void> {
    // Get the harvest and verify ownership
    const harvest = await this.prisma.harvest.findFirst({
      where: {
        id: harvestId,
        apiary: {
          userId,
        },
      },
    });

    if (!harvest) {
      throw new NotFoundException('Harvest not found or access denied');
    }

    if (harvest.status !== HarvestStatus.DRAFT) {
      throw new BadRequestException('Only draft harvests can be deleted');
    }

    await this.prisma.harvest.delete({
      where: { id: harvestId },
    });
  }

  private async calculateHoneyDistribution(
    harvestId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const harvest = await tx.harvest.findUnique({
      where: { id: harvestId },
      include: {
        harvestHives: true,
      },
    });

    if (!harvest || !harvest.totalWeight) {
      return;
    }

    const totalFrames = harvest.harvestHives.reduce(
      (sum, hh) => sum + hh.framesTaken,
      0,
    );

    if (totalFrames === 0) {
      return;
    }

    // Calculate honey amount for each hive based on frame percentage
    for (const harvestHive of harvest.harvestHives) {
      const percentage = (harvestHive.framesTaken / totalFrames) * 100;
      const honeyAmount =
        Math.round((harvest.totalWeight * percentage) / 10) / 10;

      await tx.harvestHive.update({
        where: { id: harvestHive.id },
        data: {
          honeyPercentage: Math.round(percentage * 10) / 10,
          honeyAmount,
        },
      });
    }
  }

  private mapToResponse(
    harvest: Prisma.HarvestGetPayload<{
      include: {
        harvestHives: {
          include: {
            hive: true;
          };
        };
      };
    }>,
  ): HarvestResponse {
    return {
      id: harvest.id,
      apiaryId: harvest.apiaryId,
      date: harvest.date.toISOString(),
      status: harvest.status as HarvestStatus,
      totalWeight: harvest.totalWeight ?? undefined,
      notes: harvest.notes ?? undefined,
      harvestHives: harvest.harvestHives.map((hh) => ({
        id: hh.id,
        hiveId: hh.hiveId,
        hiveName: hh.hive.name,
        framesTaken: hh.framesTaken,
        honeyAmount: hh.honeyAmount ?? undefined,
        honeyPercentage: hh.honeyPercentage ?? undefined,
      })),
      createdAt: harvest.createdAt.toISOString(),
      updatedAt: harvest.updatedAt.toISOString(),
    };
  }
}
