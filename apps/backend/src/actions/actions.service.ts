import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActionType,
  CreateActionDto,
} from '../inspections/dto/create-actions.dto';
import {
  ActionDtoSchema,
  FrameActionDetailsDto,
} from './dto/create-action.dto';
import { Prisma } from '@prisma/client';
type ActionWithRelations = Prisma.ActionGetPayload<{
  include: {
    feedingAction: true;
    treatmentAction: true;
    frameAction: true;
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
    actions: CreateActionDto[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (!actions || actions.length === 0) {
      return;
    }

    for (const action of actions) {
      const { type, notes, feedingAction, treatmentAction, frameAction } =
        action;

      // Create the base action
      const createdAction = await tx.action.create({
        data: {
          inspectionId,
          type,
          notes,
        },
      });

      // Add type-specific details based on the action type
      switch (type) {
        case ActionType.FEEDING:
          if (feedingAction) {
            await tx.feedingAction.create({
              data: {
                actionId: createdAction.id,
                feedType: feedingAction.feedType,
                amount: feedingAction.amount,
                unit: feedingAction.unit,
                concentration: feedingAction.concentration,
              },
            });
          }
          break;
        case ActionType.TREATMENT:
          if (treatmentAction) {
            await tx.treatmentAction.create({
              data: {
                actionId: createdAction.id,
                product: treatmentAction.product,
                quantity: treatmentAction.quantity,
                unit: treatmentAction.unit,
                duration: treatmentAction.duration,
              },
            });
          }
          break;
        case ActionType.FRAME:
          if (frameAction) {
            await tx.frameAction.create({
              data: {
                actionId: createdAction.id,
                quantity: frameAction.quantity,
              },
            });
          }
          break;
        // OTHER type doesn't need additional data
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
    actions: CreateActionDto[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    // Delete existing actions
    await this.deleteActions(inspectionId, tx);

    // Create new actions if provided
    if (actions && actions.length > 0) {
      await this.createActions(inspectionId, actions, tx);
    }
  }

  // Prisma-to-Domain Transformation Function
  mapPrismaToDto(prismaAction: ActionWithRelations): ActionDtoSchema {
    const base = {
      id: prismaAction.id,
      inspectionId: prismaAction.inspectionId,
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
          } as FrameActionDetailsDto,
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
