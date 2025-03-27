import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActionDtoSchema,
  ActionType,
  FeedingActionDetailsDto,
  FrameActionDetailsDto,
  TreatmentActionDetailsDto,
} from './dto/action-response.dto';
import { Prisma } from '@prisma/client';
import { CreateActionDtoSchema } from './dto/create-action.dto';

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
    actions: CreateActionDtoSchema[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (!actions || actions.length === 0) {
      return;
    }

    for (const action of actions) {
      const { type, notes, details } = action;

      // Create the base action
      const createdAction = await tx.action.create({
        data: {
          inspectionId,
          type,
          notes,
        },
      });

      // Add type-specific details based on the action type
      if (details instanceof FeedingActionDetailsDto) {
        await tx.feedingAction.create({
          data: {
            actionId: createdAction.id,
            feedType: details.feedType,
            amount: details.amount,
            unit: details.unit,
            concentration: details.concentration,
          },
        });
      } else if (details instanceof FrameActionDetailsDto) {
        await tx.frameAction.create({
          data: {
            actionId: createdAction.id,
            quantity: details.quantity,
          },
        });
      } else if (details instanceof TreatmentActionDetailsDto) {
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
    actions: CreateActionDtoSchema[],
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
