import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

import { z } from 'zod';
import { Prisma } from '@/prisma/client';
import {
  ActionFilter,
  ActionResponse,
  ActionType,
  boxTypeSchema,
  CreateAction,
  CreateStandaloneAction,
  feedAmountToGrams,
  feedSugarGrams,
  UpdateAction,
  UserPreferences,
} from 'shared-schemas';

const boxesSchema = z
  .array(z.object({ type: boxTypeSchema, frameCount: z.number().int().min(0) }))
  .nullable();
import { ApiaryUserFilter } from '../interface/request-with.apiary';

type ActionWithRelations = Prisma.ActionGetPayload<{
  include: {
    feedingAction: true;
    treatmentAction: true;
    frameAction: true;
    harvestAction: true;
    boxConfigurationAction: true;
    maintenanceAction: true;
    createdByUser: { select: { name: true; email: true } };
  };
}>;

@Injectable()
export class ActionsService {
  private readonly logger = new Logger(ActionsService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  /**
   * Creates type-specific action details within a transaction
   */
  private async createActionDetails(
    actionId: string,
    details: CreateAction['details'],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (!details) return;

    switch (details.type) {
      case ActionType.NOTE:
        // Content is stored in notes field, no additional table needed
        break;
      case ActionType.FEEDING: {
        // v2: recompute the derived values server-side (client values are a
        // convenience only) so amountG/sugarG stay trustworthy for reports.
        const amountG =
          details.enteredAmount != null && details.enteredUnit != null
            ? (feedAmountToGrams(
                details.enteredAmount,
                details.enteredUnit,
                details.density,
              ) ?? undefined)
            : details.amountG;
        const sugarG =
          amountG != null && details.sugarContent != null
            ? feedSugarGrams(amountG, details.sugarContent)
            : details.sugarG;
        await tx.feedingAction.create({
          data: {
            actionId,
            feedType: details.feedType,
            amount: details.amount,
            unit: details.unit,
            concentration: details.concentration,
            feedTypeId: details.feedTypeId,
            enteredAmount: details.enteredAmount,
            enteredUnit: details.enteredUnit,
            amountG,
            density: details.density,
            sugarContent: details.sugarContent,
            sugarG,
            waterAddedMl: details.waterAddedMl,
          },
        });
        break;
      }
      case ActionType.FRAME:
        await tx.frameAction.create({
          data: {
            actionId,
            quantity: details.quantity,
          },
        });
        break;
      case ActionType.TREATMENT:
        await tx.treatmentAction.create({
          data: {
            actionId,
            product: details.product,
            quantity: details.quantity,
            unit: details.unit,
            duration: details.duration,
          },
        });
        break;
      case ActionType.BOX_CONFIGURATION:
        await tx.boxConfigurationAction.create({
          data: {
            actionId,
            boxesAdded: details.boxesAdded,
            boxesRemoved: details.boxesRemoved,
            framesAdded: details.framesAdded,
            framesRemoved: details.framesRemoved,
            totalBoxes: details.totalBoxes,
            totalFrames: details.totalFrames,
            boxes: details.boxes ?? [],
          },
        });
        break;
      case ActionType.HARVEST:
        await tx.harvestAction.create({
          data: {
            actionId,
            amount: details.amount,
            unit: details.unit,
          },
        });
        break;
      case ActionType.MAINTENANCE:
        await tx.maintenanceAction.create({
          data: {
            actionId,
            component: details.component,
            status: details.status,
          },
        });
        break;
    }
  }

  /**
   * Fetches user preferences with fallback to defaults
   */
  private async getUserPreferencesWithFallback(
    userId: string,
  ): Promise<UserPreferences | null> {
    try {
      return await this.usersService.getUserPreferences(userId);
    } catch {
      return null;
    }
  }

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
   * Convert mass from grams to user's preferred unit (for small quantities like treatments)
   */
  private convertMassForUser(
    massGrams: number,
    userPreference: 'metric' | 'imperial' = 'metric',
  ): { value: number; unit: string } {
    if (userPreference === 'imperial') {
      const ounces = massGrams * 0.035274;
      return {
        value: Math.round(ounces * 10) / 10,
        unit: 'oz',
      };
    }

    return {
      value: Math.round(massGrams * 10) / 10,
      unit: 'g',
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
    userId?: string,
  ): Promise<void> {
    if (!actions || actions.length === 0) {
      return;
    }

    // Get the hiveId from the inspection
    const inspection = await tx.inspection.findUnique({
      where: { id: inspectionId },
      select: { hiveId: true, date: true },
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
          date: inspection.date,
          ...(userId && { createdByUserId: userId }),
        },
      });

      // Add type-specific details
      await this.createActionDetails(createdAction.id, details, tx);
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
      await tx.harvestAction.deleteMany({
        where: { actionId: action.id },
      });
      await tx.boxConfigurationAction.deleteMany({
        where: { actionId: action.id },
      });
      await tx.maintenanceAction.deleteMany({
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
    userId?: string,
  ): Promise<void> {
    // Delete existing actions
    await this.deleteActions(inspectionId, tx);

    // Create new actions if provided
    if (actions && actions.length > 0) {
      await this.createActions(inspectionId, actions, tx, userId);
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
        maintenanceAction: true,
        createdByUser: { select: { name: true, email: true } },
      },
    });

    // Get user preferences for unit conversion
    const userPreferences = filter.userId
      ? await this.getUserPreferencesWithFallback(filter.userId)
      : null;

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
          createdByUserId: userId,
        },
      });

      // Add type-specific details
      await this.createActionDetails(createdAction.id, details, tx);

      // Fetch the complete action with relations
      return await tx.action.findUnique({
        where: { id: createdAction.id },
        include: {
          feedingAction: true,
          treatmentAction: true,
          frameAction: true,
          harvestAction: true,
          boxConfigurationAction: true,
          maintenanceAction: true,
          createdByUser: { select: { name: true, email: true } },
        },
      });
    });

    if (!result) {
      throw new Error('Failed to create action');
    }

    // Get user preferences for the response
    const userPreferences = await this.getUserPreferencesWithFallback(userId);

    return this.mapPrismaToDto(result, userPreferences);
  }

  /**
   * Updates an existing action
   * @param actionId The ID of the action to update
   * @param updateActionDto The action data to update
   * @param apiaryId The apiary ID for authorization
   * @param userId The user ID for authorization
   * @returns The updated action
   */
  async updateAction(
    actionId: string,
    updateActionDto: UpdateAction,
    apiaryId: string,
    userId: string,
  ): Promise<ActionResponse> {
    // Verify the action exists and belongs to the user's apiary
    const existingAction = await this.prisma.action.findFirst({
      where: {
        id: actionId,
        hive: {
          apiary: {
            id: apiaryId,
            userId: userId,
          },
        },
      },
      include: {
        feedingAction: true,
        treatmentAction: true,
        frameAction: true,
        harvestAction: true,
        boxConfigurationAction: true,
        maintenanceAction: true,
        createdByUser: { select: { name: true, email: true } },
      },
    });

    if (!existingAction) {
      throw new ForbiddenException('Action not found or access denied');
    }

    const { type, notes, details, date } = updateActionDto;

    // Use transaction to update action and related details
    const result = await this.prisma.$transaction(async (tx) => {
      // Update the base action
      const _updatedAction = await tx.action.update({
        where: { id: actionId },
        data: {
          ...(type && { type }),
          ...(notes !== undefined && { notes }),
          ...(date && { date: new Date(date) }),
        },
      });

      // Handle type-specific details
      const _newType = type || existingAction.type;

      // If type changed or details provided, delete old details and create new ones
      if (type && type !== (existingAction.type as ActionType)) {
        // Delete old type-specific details
        await this.deleteActionDetails(actionId, tx);
      }

      // Update or create type-specific details if provided
      if (details) {
        // Delete existing details for the current type (to replace them)
        await this.deleteActionDetails(actionId, tx);

        // Create new details
        await this.createActionDetails(actionId, details, tx);
      }

      // Fetch the complete updated action with relations
      return await tx.action.findUnique({
        where: { id: actionId },
        include: {
          feedingAction: true,
          treatmentAction: true,
          frameAction: true,
          harvestAction: true,
          boxConfigurationAction: true,
          maintenanceAction: true,
          createdByUser: { select: { name: true, email: true } },
        },
      });
    });

    if (!result) {
      throw new Error('Failed to update action');
    }

    // Get user preferences for the response
    const userPreferences = await this.getUserPreferencesWithFallback(userId);

    return this.mapPrismaToDto(result, userPreferences);
  }

  /**
   * Deletes an existing action
   * @param actionId The ID of the action to delete
   * @param apiaryId The apiary ID for authorization
   * @param userId The user ID for authorization
   */
  async deleteAction(
    actionId: string,
    apiaryId: string,
    userId: string,
  ): Promise<void> {
    // Verify the action exists and belongs to the user's apiary
    const existingAction = await this.prisma.action.findFirst({
      where: {
        id: actionId,
        hive: {
          apiary: {
            id: apiaryId,
            userId: userId,
          },
        },
      },
    });

    if (!existingAction) {
      throw new ForbiddenException('Action not found or access denied');
    }

    // Delete action and related details in transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete type-specific details
      await this.deleteActionDetails(actionId, tx);

      // Delete the action
      await tx.action.delete({
        where: { id: actionId },
      });
    });
  }

  /**
   * Helper to delete type-specific action details
   */
  private async deleteActionDetails(
    actionId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.feedingAction.deleteMany({ where: { actionId } });
    await tx.treatmentAction.deleteMany({ where: { actionId } });
    await tx.frameAction.deleteMany({ where: { actionId } });
    await tx.harvestAction.deleteMany({ where: { actionId } });
    await tx.boxConfigurationAction.deleteMany({ where: { actionId } });
    await tx.maintenanceAction.deleteMany({ where: { actionId } });
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
      harvestId: prismaAction.harvestId,
      date: prismaAction.date.toISOString(),
      notes: prismaAction.notes || undefined,
      createdByUserName:
        prismaAction.createdByUser?.name || prismaAction.createdByUser?.email,
    };

    const unitPreference = userPreferences?.units || 'metric';
    switch (prismaAction.type as ActionType) {
      case ActionType.FEEDING: {
        if (!prismaAction.feedingAction) {
          this.logger.warn(
            `Feeding action details missing for action ${prismaAction.id}`,
          );
          return {
            ...base,
            type: ActionType.OTHER,
            details: { type: ActionType.OTHER },
          };
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
            // v2 fields pass through untouched (entered values are shown as
            // typed; unit-preference formatting happens in the frontend).
            feedTypeId: prismaAction.feedingAction.feedTypeId ?? undefined,
            enteredAmount: prismaAction.feedingAction.enteredAmount ?? undefined,
            enteredUnit:
              (prismaAction.feedingAction.enteredUnit as
                | 'g'
                | 'kg'
                | 'ml'
                | 'l'
                | null) ?? undefined,
            amountG: prismaAction.feedingAction.amountG ?? undefined,
            density: prismaAction.feedingAction.density ?? undefined,
            sugarContent: prismaAction.feedingAction.sugarContent ?? undefined,
            sugarG: prismaAction.feedingAction.sugarG ?? undefined,
            waterAddedMl: prismaAction.feedingAction.waterAddedMl ?? undefined,
          },
        };
      }

      case ActionType.TREATMENT: {
        if (!prismaAction.treatmentAction) {
          this.logger.warn(
            `Treatment action details missing for action ${prismaAction.id}`,
          );
          return {
            ...base,
            type: ActionType.OTHER,
            details: { type: ActionType.OTHER },
          };
        }

        // Convert units for treatments if they use volume or weight
        // Quantity can be null for treatments that don't require it (e.g., fumigation)
        let convertedQuantity: number | null =
          prismaAction.treatmentAction.quantity;
        let convertedTreatmentUnit = prismaAction.treatmentAction.unit;

        // Only convert if quantity is not null
        if (convertedQuantity !== null) {
          if (
            prismaAction.treatmentAction.unit === 'L' ||
            prismaAction.treatmentAction.unit === 'ml'
          ) {
            const volumeInLiters =
              prismaAction.treatmentAction.unit === 'ml'
                ? convertedQuantity / 1000
                : convertedQuantity;
            const converted = this.convertVolumeForUser(
              volumeInLiters,
              unitPreference,
            );
            convertedQuantity = converted.value;
            convertedTreatmentUnit = converted.unit;
          } else if (prismaAction.treatmentAction.unit === 'g') {
            // Use mass conversion for grams (g → oz for imperial)
            const converted = this.convertMassForUser(
              convertedQuantity,
              unitPreference,
            );
            convertedQuantity = converted.value;
            convertedTreatmentUnit = converted.unit;
          }
          // 'pcs' unit passes through unchanged - no conversion needed
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
          this.logger.warn(
            `Frame action details missing for action ${prismaAction.id}`,
          );
          return {
            ...base,
            type: ActionType.OTHER,
            details: { type: ActionType.OTHER },
          };
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
          this.logger.warn(
            `Harvest action details missing for action ${prismaAction.id}`,
          );
          return {
            ...base,
            type: ActionType.OTHER,
            details: { type: ActionType.OTHER },
          };
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

      case ActionType.MAINTENANCE:
        if (!prismaAction.maintenanceAction) {
          this.logger.warn(
            `Maintenance action details missing for action ${prismaAction.id}`,
          );
          return {
            ...base,
            type: ActionType.OTHER,
            details: { type: ActionType.OTHER },
          };
        }
        return {
          ...base,
          type: ActionType.MAINTENANCE,
          details: {
            type: ActionType.MAINTENANCE as const,
            component: prismaAction.maintenanceAction.component as
              | 'BOX'
              | 'BOTTOM_BOARD'
              | 'COVER',
            status: prismaAction.maintenanceAction.status as
              | 'CLEANED'
              | 'REPLACED',
          },
        };

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
          this.logger.warn(
            `Box configuration action details missing for action ${prismaAction.id}`,
          );
          return {
            ...base,
            type: ActionType.OTHER,
            details: { type: ActionType.OTHER },
          };
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
            boxes: (() => {
              const parsed = boxesSchema.safeParse(
                prismaAction.boxConfigurationAction.boxes,
              );
              return parsed.success ? (parsed.data ?? undefined) : undefined;
            })(),
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
