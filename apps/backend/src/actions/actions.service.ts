import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { Prisma } from '@prisma/client';
import {
  ActionFilter,
  ActionResponse,
  ActionType,
  CreateAction,
  CreateStandaloneAction,
} from 'shared-schemas';
import { ApiaryUserFilter } from '../interface/request-with.apiary';

type ActionWithRelations = Prisma.ActionGetPayload<{
  include: {
    feedingAction: true;
    treatmentAction: true;
    frameAction: true;
    harvestAction: true;
  };
}>;

@Injectable()
export class ActionsService {
  constructor(private prisma: PrismaService) {}

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
      if (details?.type === ActionType.FEEDING) {
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
      } else if (details?.type === ActionType.FRAME) {
        await tx.frameAction.create({
          data: {
            actionId: createdAction.id,
            quantity: details.quantity,
          },
        });
      } else if (details?.type === ActionType.TREATMENT) {
        await tx.treatmentAction.create({
          data: {
            actionId: createdAction.id,
            product: details.product,
            quantity: details.quantity,
            unit: details.unit,
            duration: details.duration,
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
      },
    });

    return actions.map((action) => this.mapPrismaToDto(action));
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
      if (details?.type === ActionType.FEEDING) {
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
      } else if (details?.type === ActionType.FRAME) {
        await tx.frameAction.create({
          data: {
            actionId: createdAction.id,
            quantity: details.quantity,
          },
        });
      } else if (details?.type === ActionType.TREATMENT) {
        await tx.treatmentAction.create({
          data: {
            actionId: createdAction.id,
            product: details.product,
            quantity: details.quantity,
            unit: details.unit,
            duration: details.duration,
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
        },
      });
    });

    if (!result) {
      throw new Error('Failed to create action');
    }

    return this.mapPrismaToDto(result);
  }

  // Prisma-to-Domain Transformation Function
  mapPrismaToDto(prismaAction: ActionWithRelations): ActionResponse {
    const base = {
      id: prismaAction.id,
      hiveId: prismaAction.hiveId,
      inspectionId: prismaAction.inspectionId,
      date: prismaAction.date.toISOString(),
      notes: prismaAction.notes || undefined,
    };
    switch (prismaAction.type) {
      case ActionType.FEEDING:
        if (!prismaAction.feedingAction) {
          throw new Error('Feeding action details missing');
        }
        return {
          ...base,
          type: ActionType.FEEDING,
          details: {
            type: ActionType.FEEDING,
            feedType: prismaAction.feedingAction.feedType,
            amount: prismaAction.feedingAction.amount,
            unit: prismaAction.feedingAction.unit,
            concentration:
              prismaAction.feedingAction.concentration || undefined,
          },
        };

      case ActionType.TREATMENT:
        if (!prismaAction.treatmentAction) {
          throw new Error('Treatment action details missing');
        }
        return {
          ...base,
          type: ActionType.TREATMENT,
          details: {
            type: ActionType.TREATMENT,
            product: prismaAction.treatmentAction.product,
            quantity: prismaAction.treatmentAction.quantity,
            unit: prismaAction.treatmentAction.unit,
            duration: prismaAction.treatmentAction.duration ?? undefined,
          },
        };

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

      case ActionType.HARVEST:
        if (!prismaAction.harvestAction) {
          throw new Error('Harvest action details missing');
        }
        return {
          ...base,
          type: ActionType.HARVEST,
          details: {
            type: ActionType.HARVEST,
            amount: prismaAction.harvestAction.amount,
            unit: prismaAction.harvestAction.unit,
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
