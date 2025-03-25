import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActionType,
  CreateActionDto,
} from '../inspections/dto/create-actions.dto';
import {
  ActionDtoUnion,
  FeedingActionDetailsDto,
  FeedingActionDto,
  FrameActionDto,
  TreatmentActionDetailsDto,
  TreatmentActionDto,
} from './dto/create-action.dto';
import { Prisma } from '@prisma/client';
type ActionWithRelations = Prisma.ActionGetPayload<{
  include: {
    feedingAction: true;
    treatmentAction: true;
    frameAction: true;
  };
}>;
export interface BaseAction {
  id: string;
  inspectionId: string;
  type: ActionType;
  notes?: string;
}

// Specific Action Detail Interfaces
export interface FeedingActionDetails {
  feedType: string;
  amount: number;
  unit: string;
  concentration?: string;
}

export interface TreatmentActionDetails {
  product: string;
  quantity: number;
  unit: string;
  duration?: string;
}

export interface FrameActionDetails {
  quantity: number;
}

// Union Type for Action Details
export type ActionDetails =
  | { type: ActionType.FEEDING; details: FeedingActionDetails }
  | { type: ActionType.TREATMENT; details: TreatmentActionDetails }
  | { type: ActionType.FRAME; details: FrameActionDetails }
  | { type: ActionType.OTHER; details: null };

// Complete Action Type
export interface Action extends BaseAction {
  details: ActionDetails;
}

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

  actionToDto(action: Action): ActionDtoUnion {
    switch (action.details.type) {
      case ActionType.FEEDING:
        return {
          id: action.id,
          inspectionId: action.inspectionId,
          type: ActionType.FEEDING,
          notes: action.notes,
          details: action.details.details as FeedingActionDetailsDto,
        } as FeedingActionDto;

      case ActionType.TREATMENT:
        return {
          id: action.id,
          inspectionId: action.inspectionId,
          type: ActionType.TREATMENT,
          notes: action.notes,
          details: action.details.details as TreatmentActionDetailsDto,
        } as TreatmentActionDto;

      case ActionType.FRAME:
        return {
          id: action.id,
          inspectionId: action.inspectionId,
          type: ActionType.FRAME,
          notes: action.notes,
          details: action.details.details,
        } as FrameActionDto;
      default:
        return {
          id: action.id,
          inspectionId: action.inspectionId,
          type: ActionType.OTHER,
          notes: action.notes,
        };
    }
  }
  // Prisma-to-Domain Transformation Function
  mapPrismaToDomain(prismaAction: ActionWithRelations): Action {
    let details: ActionDetails;

    switch (prismaAction.type) {
      case ActionType.FEEDING:
        if (!prismaAction.feedingAction) {
          throw new Error('Feeding action details missing');
        }
        details = {
          type: ActionType.FEEDING,
          details: {
            feedType: prismaAction.feedingAction.feedType,
            amount: prismaAction.feedingAction.amount,
            unit: prismaAction.feedingAction.unit,
            concentration:
              prismaAction.feedingAction.concentration || undefined,
          },
        };
        break;

      case ActionType.TREATMENT:
        if (!prismaAction.treatmentAction) {
          throw new Error('Treatment action details missing');
        }
        details = {
          type: ActionType.TREATMENT,
          details: {
            product: prismaAction.treatmentAction.product,
            quantity: prismaAction.treatmentAction.quantity,
            unit: prismaAction.treatmentAction.unit,
            duration: prismaAction.treatmentAction.duration || undefined,
          },
        };
        break;

      case ActionType.FRAME:
        if (!prismaAction.frameAction) {
          throw new Error('Frame action details missing');
        }
        details = {
          type: ActionType.FRAME,
          details: {
            quantity: prismaAction.frameAction.quantity,
          },
        };
        break;

      default:
        details = {
          type: ActionType.OTHER,
          details: null,
        };
        break;
    }

    return {
      id: prismaAction.id,
      inspectionId: prismaAction.inspectionId,
      type: prismaAction.type as ActionType,
      notes: prismaAction.notes || undefined,
      details,
    };
  }

  // Example of how to use the transformation in an endpoint
  async getActionsForInspection(inspectionId: string) {
    const prismaActions = await this.prisma.action.findMany({
      where: { inspectionId },
      include: {
        feedingAction: true,
        treatmentAction: true,
        frameAction: true,
      },
    });

    return prismaActions.map((a) => this.mapPrismaToDomain(a));
  }
}
