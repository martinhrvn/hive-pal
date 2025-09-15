import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

import { Prisma } from '@prisma/client';
import {
  ActionFilter,
  ActionResponse,
  ActionType,
  CreateAction,
  CreateStandaloneAction,
  UserPreferences,
} from 'shared-schemas';
import { ApiaryUserFilter } from '../interface/request-with.apiary';

type ActionWithRelations = Prisma.ActionGetPayload<{
  include: {
    feedingAction: true;
    treatmentAction: true;
    frameAction: true;
    harvestAction: true;
    boxConfigurationAction: true;
  };
}>;

@Injectable()
export class ActionsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  /**
   * Convert volume from liters to user's preferred unit
   */
  private convertVolumeForUser(
    volumeLiters: number,
    userPreference: 'metric' | 'imperial' = 'metric',
  ): { value: number; unit: string } {
    if (userPreference === 'imperial') {
      const fluidOunces = volumeLiters * 33.814;

      if (fluidOunces < 32) {
        return {
          value: Math.round(fluidOunces * 10) / 10,
          unit: 'fl oz',
        };
      } else if (fluidOunces < 128) {
        const quarts = volumeLiters * 1.05669;
        return {
          value: Math.round(quarts * 100) / 100,
          unit: 'qt',
        };
      } else {
        const gallons = volumeLiters * 0.264172;
        return {
          value: Math.round(gallons * 100) / 100,
          unit: 'gal',
        };
      }
    }

    // Metric: show in ml for small volumes, L for larger
    if (volumeLiters < 1) {
      const milliliters = volumeLiters * 1000;
      return {
        value: Math.round(milliliters),
        unit: 'ml',
      };
    }

    return {
      value: Math.round(volumeLiters * 100) / 100,
      unit: 'L',
    };
  }

  /**
   * Convert weight from kg to user's preferred unit
   */
  private convertWeightForUser(
    weightKg: number,
    userPreference: 'metric' | 'imperial' = 'metric',
  ): { value: number; unit: string } {
    if (userPreference === 'imperial') {
      const pounds = weightKg * 2.20462;
      return {
        value: Math.round(pounds * 100) / 100,
        unit: 'lb',
      };
    }

    return {
      value: Math.round(weightKg * 100) / 100,
      unit: 'kg',
    };
  }

  /**
   * Creates actions for an inspection within a transaction
   * @param inspectionId The ID of the inspection to add actions to
   * @param actions Array of actions to create
   * @param tx Prisma transaction client
   */
  async createActions(
    inspectionId: string,
    actions: CreateAction[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (!actions || actions.length === 0) {
      return;
    }

    // Get the hiveId from the inspection
    const inspection = await tx.inspection.findUnique({
      where: { id: inspectionId },
      select: { hiveId: true },
    });

    if (!inspection) {
      throw new Error('Inspection not found');
    }

    for (const action of actions) {
      const { type, notes, details } = action;

      // Create the base action
      const createdAction = await tx.action.create({
        data: {
          hiveId: inspection.hiveId,
          inspectionId,
          type,
          notes,
        },
      });

      // Add type-specific details based on the action type
      if (!details) continue;

      if (details.type === ActionType.NOTE) {
        // For NOTE type, the content is stored in the notes field
        // No additional table needed
      } else if (details.type === ActionType.FEEDING) {
        const feedingDetails = details;
        await tx.feedingAction.create({
          data: {
            actionId: createdAction.id,
            feedType: feedingDetails.feedType,
            amount: feedingDetails.amount,
            unit: feedingDetails.unit,
            concentration: feedingDetails.concentration,
          },
        });
      } else if (details.type === ActionType.FRAME) {
        await tx.frameAction.create({
          data: {
            actionId: createdAction.id,
            quantity: details.quantity,
          },
        });
      } else if (details.type === ActionType.TREATMENT) {
        await tx.treatmentAction.create({
          data: {
            actionId: createdAction.id,
            product: details.product,
            quantity: details.quantity,
            unit: details.unit,
            duration: details.duration,
          },
        });
      } else if (details.type === ActionType.BOX_CONFIGURATION) {
        await tx.boxConfigurationAction.create({
          data: {
            actionId: createdAction.id,
            boxesAdded: details.boxesAdded,
            boxesRemoved: details.boxesRemoved,
            framesAdded: details.framesAdded,
            framesRemoved: details.framesRemoved,
            totalBoxes: details.totalBoxes,
            totalFrames: details.totalFrames,
          },
        });
      }
    }
  }

  /**
   * Deletes all actions for an inspection within a transaction
   * @param inspectionId The ID of the inspection to delete actions from
   * @param tx Prisma transaction client
   */
  async deleteActions(
    inspectionId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    // Get all actions for this inspection
    const existingActions = await tx.action.findMany({
      where: { inspectionId },
      select: { id: true },
    });

    // Delete all related action details
    for (const action of existingActions) {
      await tx.feedingAction.deleteMany({
        where: { actionId: action.id },
      });
      await tx.treatmentAction.deleteMany({
        where: { actionId: action.id },
      });
      await tx.frameAction.deleteMany({
        where: { actionId: action.id },
      });
      await tx.boxConfigurationAction.deleteMany({
        where: { actionId: action.id },
      });
    }

    // Delete all actions
    await tx.action.deleteMany({
      where: { inspectionId },
    });
  }

  /**
   * Updates actions for an inspection within a transaction
   * @param inspectionId The ID of the inspection to update actions for
   * @param actions New actions array
   * @param tx Prisma transaction client
   */
  async updateActions(
    inspectionId: string,
    actions: CreateAction[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    // Delete existing actions
    await this.deleteActions(inspectionId, tx);

    // Create new actions if provided
    if (actions && actions.length > 0) {
      await this.createActions(inspectionId, actions, tx);
    }
  }

  /**
   * Find all actions based on filter criteria
   * @param filter Filter criteria for actions
   * @returns Array of action responses
   */
  async findAll(
    filter: ActionFilter & Partial<ApiaryUserFilter>,
  ): Promise<ActionResponse[]> {
    const whereClause: Prisma.ActionWhereInput = {
      type: filter.type ?? undefined,
      // Filter by date range (using action date now, not inspection date)
      ...(filter.startDate || filter.endDate
        ? {
            date: {
              ...(filter.startDate && { gte: new Date(filter.startDate) }),
              ...(filter.endDate && { lte: new Date(filter.endDate) }),
            },
          }
        : {}),
      // Filter by hive if specified
      ...(filter.hiveId && { hiveId: filter.hiveId }),
      // Ensure the action belongs to the user's apiary
      hive: {
        ...(filter.apiaryId && {
          apiary: {
            id: filter.apiaryId,
            userId: filter.userId,
          },
        }),
      },
    };

    const actions = await this.prisma.action.findMany({
      where: whereClause,
      orderBy: [{ date: 'desc' }, { id: 'asc' }],
      include: {
        feedingAction: true,
        treatmentAction: true,
        frameAction: true,
        harvestAction: true,
        boxConfigurationAction: true,
      },
    });

    // Get user preferences for unit conversion
    let userPreferences: UserPreferences | null = null;
    if (filter.userId) {
      try {
        userPreferences = await this.usersService.getUserPreferences(
          filter.userId,
        );
      } catch {
        // If we can't get preferences, use defaults
      }
    }

    return actions.map((action) =>
      this.mapPrismaToDto(action, userPreferences),
    );
  }

  /**
   * Creates a standalone action (not tied to an inspection)
   * @param createActionDto The action data to create
   * @param apiaryId The apiary ID for authorization
   * @param userId The user ID for authorization
   * @returns The created action
   */
  async createStandaloneAction(
    createActionDto: CreateStandaloneAction,
    apiaryId: string,
    userId: string,
  ): Promise<ActionResponse> {
    // Verify the hive belongs to the user's apiary
    const hive = await this.prisma.hive.findFirst({
      where: {
        id: createActionDto.hiveId,
        apiary: {
          id: apiaryId,
          userId: userId,
        },
      },
    });

    if (!hive) {
      throw new ForbiddenException('Hive not found or access denied');
    }

    const { type, notes, details, date } = createActionDto;

    // Use transaction to create action and related details
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the base action
      const createdAction = await tx.action.create({
        data: {
          hiveId: createActionDto.hiveId,
          type,
          notes,
          date: date ? new Date(date) : new Date(),
        },
      });

      // Add type-specific details based on the action type
      if (!details) return;

      if (details.type === ActionType.NOTE) {
        // For NOTE type, the content is stored in the notes field
        // No additional table needed
      } else if (details.type === ActionType.FEEDING) {
        const feedingDetails = details;
        await tx.feedingAction.create({
          data: {
            actionId: createdAction.id,
            feedType: feedingDetails.feedType,
            amount: feedingDetails.amount,
            unit: feedingDetails.unit,
            concentration: feedingDetails.concentration,
          },
        });
      } else if (details.type === ActionType.FRAME) {
        await tx.frameAction.create({
          data: {
            actionId: createdAction.id,
            quantity: details.quantity,
          },
        });
      } else if (details.type === ActionType.TREATMENT) {
        await tx.treatmentAction.create({
          data: {
            actionId: createdAction.id,
            product: details.product,
            quantity: details.quantity,
            unit: details.unit,
            duration: details.duration,
          },
        });
      } else if (details.type === ActionType.BOX_CONFIGURATION) {
        await tx.boxConfigurationAction.create({
          data: {
            actionId: createdAction.id,
            boxesAdded: details.boxesAdded,
            boxesRemoved: details.boxesRemoved,
            framesAdded: details.framesAdded,
            framesRemoved: details.framesRemoved,
            totalBoxes: details.totalBoxes,
            totalFrames: details.totalFrames,
          },
        });
      }

      // Fetch the complete action with relations
      return await tx.action.findUnique({
        where: { id: createdAction.id },
        include: {
          feedingAction: true,
          treatmentAction: true,
          frameAction: true,
          harvestAction: true,
          boxConfigurationAction: true,
        },
      });
    });

    if (!result) {
      throw new Error('Failed to create action');
    }

    // Get user preferences for the response
    let userPreferences: UserPreferences | null = null;
    try {
      userPreferences = await this.usersService.getUserPreferences(userId);
    } catch {
      // If we can't get preferences, use defaults
    }

    return this.mapPrismaToDto(result, userPreferences);
  }

  // Prisma-to-Domain Transformation Function
  mapPrismaToDto(
    prismaAction: ActionWithRelations,
    userPreferences?: UserPreferences | null,
  ): ActionResponse {
    const base = {
      id: prismaAction.id,
      hiveId: prismaAction.hiveId,
      inspectionId: prismaAction.inspectionId,
      date: prismaAction.date.toISOString(),
      notes: prismaAction.notes || undefined,
    };

    const unitPreference = userPreferences?.units || 'metric';
    switch (prismaAction.type) {
      case ActionType.FEEDING: {
        if (!prismaAction.feedingAction) {
          throw new Error('Feeding action details missing');
        }

        // Convert volume units for feeding actions
        let convertedAmount = prismaAction.feedingAction.amount;
        let convertedUnit = prismaAction.feedingAction.unit;

        // Assume stored values are in metric units (L/ml)
        if (
          prismaAction.feedingAction.unit === 'L' ||
          prismaAction.feedingAction.unit === 'ml'
        ) {
          const volumeInLiters =
            prismaAction.feedingAction.unit === 'ml'
              ? prismaAction.feedingAction.amount / 1000
              : prismaAction.feedingAction.amount;
          const converted = this.convertVolumeForUser(
            volumeInLiters,
            unitPreference,
          );
          convertedAmount = converted.value;
          convertedUnit = converted.unit;
        }

        return {
          ...base,
          type: ActionType.FEEDING,
          details: {
            type: ActionType.FEEDING,
            feedType: prismaAction.feedingAction.feedType,
            amount: convertedAmount,
            unit: convertedUnit,
            concentration:
              prismaAction.feedingAction.concentration || undefined,
          },
        };
      }

      case ActionType.TREATMENT: {
        if (!prismaAction.treatmentAction) {
          throw new Error('Treatment action details missing');
        }

        // Convert units for treatments if they use volume or weight
        let convertedQuantity = prismaAction.treatmentAction.quantity;
        let convertedTreatmentUnit = prismaAction.treatmentAction.unit;

        if (
          prismaAction.treatmentAction.unit === 'L' ||
          prismaAction.treatmentAction.unit === 'ml'
        ) {
          const volumeInLiters =
            prismaAction.treatmentAction.unit === 'ml'
              ? prismaAction.treatmentAction.quantity / 1000
              : prismaAction.treatmentAction.quantity;
          const converted = this.convertVolumeForUser(
            volumeInLiters,
            unitPreference,
          );
          convertedQuantity = converted.value;
          convertedTreatmentUnit = converted.unit;
        } else if (
          prismaAction.treatmentAction.unit === 'kg' ||
          prismaAction.treatmentAction.unit === 'g'
        ) {
          const weightInKg =
            prismaAction.treatmentAction.unit === 'g'
              ? prismaAction.treatmentAction.quantity / 1000
              : prismaAction.treatmentAction.quantity;
          const converted = this.convertWeightForUser(
            weightInKg,
            unitPreference,
          );
          convertedQuantity = converted.value;
          convertedTreatmentUnit = converted.unit;
        }

        return {
          ...base,
          type: ActionType.TREATMENT,
          details: {
            type: ActionType.TREATMENT,
            product: prismaAction.treatmentAction.product,
            quantity: convertedQuantity,
            unit: convertedTreatmentUnit,
            duration: prismaAction.treatmentAction.duration ?? undefined,
          },
        };
      }

      case ActionType.FRAME:
        if (!prismaAction.frameAction) {
          throw new Error('Frame action details missing');
        }
        return {
          ...base,
          type: ActionType.FRAME,
          details: {
            type: ActionType.FRAME,
            quantity: prismaAction.frameAction.quantity,
          },
        };

      case ActionType.HARVEST: {
        if (!prismaAction.harvestAction) {
          throw new Error('Harvest action details missing');
        }

        // Convert weight units for harvest actions
        let convertedHarvestAmount = prismaAction.harvestAction.amount;
        let convertedHarvestUnit = prismaAction.harvestAction.unit;

        if (
          prismaAction.harvestAction.unit === 'kg' ||
          prismaAction.harvestAction.unit === 'lb'
        ) {
          const weightInKg =
            prismaAction.harvestAction.unit === 'lb'
              ? prismaAction.harvestAction.amount / 2.20462
              : prismaAction.harvestAction.amount;
          const converted = this.convertWeightForUser(
            weightInKg,
            unitPreference,
          );
          convertedHarvestAmount = converted.value;
          convertedHarvestUnit = converted.unit;
        }

        return {
          ...base,
          type: ActionType.HARVEST,
          details: {
            type: ActionType.HARVEST,
            amount: convertedHarvestAmount,
            unit: convertedHarvestUnit,
          },
        };
      }

      case ActionType.NOTE:
        return {
          ...base,
          type: ActionType.NOTE,
          details: {
            type: ActionType.NOTE,
            content: prismaAction.notes || '',
          },
        };

      case ActionType.BOX_CONFIGURATION:
        if (!prismaAction.boxConfigurationAction) {
          throw new Error('Box configuration action details missing');
        }
        return {
          ...base,
          type: ActionType.BOX_CONFIGURATION,
          details: {
            type: ActionType.BOX_CONFIGURATION as const,
            boxesAdded: prismaAction.boxConfigurationAction.boxesAdded,
            boxesRemoved: prismaAction.boxConfigurationAction.boxesRemoved,
            framesAdded: prismaAction.boxConfigurationAction.framesAdded,
            framesRemoved: prismaAction.boxConfigurationAction.framesRemoved,
            totalBoxes: prismaAction.boxConfigurationAction.totalBoxes,
            totalFrames: prismaAction.boxConfigurationAction.totalFrames,
          },
        };

      default:
        return {
          ...base,
          type: ActionType.OTHER,
          details: {
            type: ActionType.OTHER,
          },
        };
    }
  }
}
