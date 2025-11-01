import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBatchInspection,
  UpdateBatchInspection,
  ReorderBatchHives,
  BatchInspectionResponse,
  BatchInspectionStatus,
  BatchHiveStatus,
  CurrentHiveToInspect,
  CreateInspection,
} from 'shared-schemas';
import { InspectionsService } from '../inspections/inspections.service';

@Injectable()
export class BatchInspectionsService {
  constructor(
    private prisma: PrismaService,
    private inspectionsService: InspectionsService,
  ) { }

  /**
   * Create a new batch inspection
   */
  async create(
    apiaryId: string,
    userId: string,
    createDto: CreateBatchInspection,
  ): Promise<BatchInspectionResponse> {
    // Verify apiary ownership
    const apiary = await this.prisma.apiary.findFirst({
      where: { id: apiaryId, userId },
    });

    if (!apiary) {
      throw new ForbiddenException('Apiary not found or access denied');
    }

    // Verify all hives belong to this apiary
    const hives = await this.prisma.hive.findMany({
      where: {
        id: { in: createDto.hiveIds },
        apiaryId,
      },
    });

    if (hives.length !== createDto.hiveIds.length) {
      throw new BadRequestException(
        'One or more hives do not belong to this apiary',
      );
    }

    // Create batch inspection with hives in the provided order
    const batchInspection = await this.prisma.batchInspection.create({
      data: {
        name: createDto.name,
        apiaryId,
        status: BatchInspectionStatus.DRAFT,
        hives: {
          create: createDto.hiveIds.map((hiveId, index) => ({
            hiveId,
            order: index,
            status: BatchHiveStatus.PENDING,
          })),
        },
      },
      include: {
        hives: {
          include: {
            hive: {
              select: {
                id: true,
                name: true,
                status: true,
                apiaryId: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return this.mapToResponse(batchInspection);
  }

  /**
   * Get all batch inspections for an apiary
   */
  async findAll(apiaryId: string, userId: string) {
    // Verify apiary ownership
    await this.verifyApiaryOwnership(apiaryId, userId);

    const batchInspections = await this.prisma.batchInspection.findMany({
      where: { apiaryId },
      include: {
        hives: {
          include: {
            hive: {
              select: {
                id: true,
                name: true,
                status: true,
                apiaryId: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return batchInspections.map((batch) => this.mapToResponse(batch));
  }

  /**
   * Get a specific batch inspection
   */
  async findOne(
    id: string,
    apiaryId: string,
    userId: string,
  ): Promise<BatchInspectionResponse> {
    // Verify apiary ownership
    await this.verifyApiaryOwnership(apiaryId, userId);

    const batchInspection = await this.prisma.batchInspection.findFirst({
      where: { id, apiaryId },
      include: {
        hives: {
          include: {
            hive: {
              select: {
                id: true,
                name: true,
                status: true,
                apiaryId: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!batchInspection) {
      throw new NotFoundException('Batch inspection not found');
    }

    return this.mapToResponse(batchInspection);
  }

  /**
   * Update batch inspection (name only, and only when DRAFT)
   */
  async update(
    id: string,
    apiaryId: string,
    userId: string,
    updateDto: UpdateBatchInspection,
  ): Promise<BatchInspectionResponse> {
    // Verify apiary ownership and get batch
    const batch = await this.getBatchAndVerifyOwnership(id, apiaryId, userId);

    if (batch.status !== BatchInspectionStatus.DRAFT) {
      throw new BadRequestException(
        'Can only update batch inspection name when in DRAFT status',
      );
    }

    const updated = await this.prisma.batchInspection.update({
      where: { id },
      data: {
        name: updateDto.name,
      },
      include: {
        hives: {
          include: {
            hive: {
              select: {
                id: true,
                name: true,
                status: true,
                apiaryId: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return this.mapToResponse(updated);
  }

  /**
   * Delete batch inspection (only when DRAFT)
   */
  async delete(id: string, apiaryId: string, userId: string): Promise<void> {
    const batch = await this.getBatchAndVerifyOwnership(id, apiaryId, userId);

    if (batch.status !== BatchInspectionStatus.DRAFT) {
      throw new BadRequestException(
        'Can only delete batch inspection when in DRAFT status',
      );
    }

    await this.prisma.batchInspection.delete({
      where: { id },
    });
  }

  /**
   * Reorder hives in batch (only when DRAFT)
   */
  async reorderHives(
    id: string,
    apiaryId: string,
    userId: string,
    reorderDto: ReorderBatchHives,
  ): Promise<BatchInspectionResponse> {
    const batch = await this.getBatchAndVerifyOwnership(id, apiaryId, userId);

    if (batch.status !== BatchInspectionStatus.DRAFT) {
      throw new BadRequestException(
        'Can only reorder hives when batch is in DRAFT status',
      );
    }

    // Update all hive orders in a transaction
    await this.prisma.$transaction(
      reorderDto.hiveOrders.map((hiveOrder) =>
        this.prisma.batchInspectionHive.updateMany({
          where: {
            batchInspectionId: id,
            hiveId: hiveOrder.hiveId,
          },
          data: {
            order: hiveOrder.order,
          },
        }),
      ),
    );

    return this.findOne(id, apiaryId, userId);
  }

  /**
   * Start batch inspection
   */
  async start(
    id: string,
    apiaryId: string,
    userId: string,
  ): Promise<BatchInspectionResponse> {
    const batch = await this.getBatchAndVerifyOwnership(id, apiaryId, userId);

    if (batch.status !== BatchInspectionStatus.DRAFT) {
      throw new BadRequestException(
        'Can only start batch inspection from DRAFT status',
      );
    }

    const updated = await this.prisma.batchInspection.update({
      where: { id },
      data: {
        status: BatchInspectionStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      include: {
        hives: {
          include: {
            hive: {
              select: {
                id: true,
                name: true,
                status: true,
                apiaryId: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return this.mapToResponse(updated);
  }

  /**
   * Get current hive to inspect
   */
  async getCurrentHive(
    id: string,
    apiaryId: string,
    userId: string,
  ): Promise<CurrentHiveToInspect> {
    const batch = await this.getBatchAndVerifyOwnership(id, apiaryId, userId);

    if (
      batch.status !== BatchInspectionStatus.IN_PROGRESS &&
      batch.status !== BatchInspectionStatus.DRAFT
    ) {
      throw new BadRequestException(
        'Batch inspection is not active or in draft status',
      );
    }

    // Find first pending hive (by order)
    const currentHive = await this.prisma.batchInspectionHive.findFirst({
      where: {
        batchInspectionId: id,
        status: BatchHiveStatus.PENDING,
      },
      include: {
        hive: {
          select: {
            id: true,
            name: true,
            status: true,
            apiaryId: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    if (!currentHive) {
      throw new NotFoundException('No pending hives in this batch');
    }

    const allHives = await this.prisma.batchInspectionHive.findMany({
      where: { batchInspectionId: id },
      orderBy: { order: 'asc' },
    });

    const position = allHives.findIndex((h) => h.id === currentHive.id) + 1;
    const hasNext = position < allHives.length;
    const hasPrevious = position > 1;

    return {
      batchInspectionHive: {
        id: currentHive.id,
        hiveId: currentHive.hiveId,
        order: currentHive.order,
        status: currentHive.status as BatchHiveStatus,
        inspectionId: currentHive.inspectionId,
        completedAt: currentHive.completedAt?.toISOString() || null,
        skippedCount: currentHive.skippedCount,
        hive: currentHive.hive,
      },
      position,
      hasNext,
      hasPrevious,
    };
  }

  /**
   * Skip current hive (move to end of queue)
   */
  async skipHive(
    id: string,
    apiaryId: string,
    userId: string,
  ): Promise<CurrentHiveToInspect> {
    const batch = await this.getBatchAndVerifyOwnership(id, apiaryId, userId);

    if (batch.status !== BatchInspectionStatus.IN_PROGRESS) {
      throw new BadRequestException('Batch inspection is not in progress');
    }

    // Get current hive
    const currentHive = await this.prisma.batchInspectionHive.findFirst({
      where: {
        batchInspectionId: id,
        status: BatchHiveStatus.PENDING,
      },
      orderBy: {
        order: 'asc',
      },
    });

    if (!currentHive) {
      throw new NotFoundException('No pending hives to skip');
    }

    // Get all hives to determine new order
    const allHives = await this.prisma.batchInspectionHive.findMany({
      where: { batchInspectionId: id },
      orderBy: { order: 'asc' },
    });

    const maxOrder = Math.max(...allHives.map((h) => h.order));

    // Move to end and increment skipped count
    await this.prisma.batchInspectionHive.update({
      where: { id: currentHive.id },
      data: {
        order: maxOrder + 1,
        skippedCount: currentHive.skippedCount + 1,
      },
    });

    // Return next pending hive
    return this.getCurrentHive(id, apiaryId, userId);
  }

  /**
   * Cancel a hive from the batch
   */
  async cancelHive(
    id: string,
    hiveId: string,
    apiaryId: string,
    userId: string,
  ): Promise<BatchInspectionResponse> {
    const batch = await this.getBatchAndVerifyOwnership(id, apiaryId, userId);

    if (batch.status === BatchInspectionStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel hives in completed batch');
    }

    await this.prisma.batchInspectionHive.updateMany({
      where: {
        batchInspectionId: id,
        hiveId,
      },
      data: {
        status: BatchHiveStatus.CANCELLED,
      },
    });

    // Check if all remaining hives are completed
    await this.checkAndCompleteIfDone(id);

    return this.findOne(id, apiaryId, userId);
  }

  /**
   * Create inspection for current hive and move to next
   */
  async createInspectionAndNext(
    id: string,
    apiaryId: string,
    userId: string,
    inspectionData: CreateInspection,
  ): Promise<{ inspection: any; next: CurrentHiveToInspect | null }> {
    const batch = await this.getBatchAndVerifyOwnership(id, apiaryId, userId);

    if (batch.status !== BatchInspectionStatus.IN_PROGRESS) {
      throw new BadRequestException('Batch inspection is not in progress');
    }

    // Get current hive
    const currentHive = await this.prisma.batchInspectionHive.findFirst({
      where: {
        batchInspectionId: id,
        status: BatchHiveStatus.PENDING,
      },
      orderBy: {
        order: 'asc',
      },
    });

    if (!currentHive) {
      throw new NotFoundException('No pending hives in this batch');
    }

    // Verify the inspection is for the current hive
    if (inspectionData.hiveId !== currentHive.hiveId) {
      throw new BadRequestException(
        'Inspection hive does not match current hive in batch',
      );
    }

    // Create the inspection
    const inspection = await this.inspectionsService.create(
      inspectionData,
      { apiaryId, userId }
    );

    // Update batch hive record
    await this.prisma.batchInspectionHive.update({
      where: { id: currentHive.id },
      data: {
        status: BatchHiveStatus.COMPLETED,
        inspectionId: inspection.id,
        completedAt: new Date(),
      },
    });

    // Check if batch is complete
    await this.checkAndCompleteIfDone(id);

    // Get next hive if available
    let next: CurrentHiveToInspect | null = null;
    try {
      next = await this.getCurrentHive(id, apiaryId, userId);
    } catch (error) {
      // No more hives - batch is complete
      next = null;
    }

    return { inspection, next };
  }

  /**
   * Check if all hives are done and mark batch as complete
   */
  private async checkAndCompleteIfDone(batchId: string): Promise<void> {
    const pendingCount = await this.prisma.batchInspectionHive.count({
      where: {
        batchInspectionId: batchId,
        status: BatchHiveStatus.PENDING,
      },
    });

    if (pendingCount === 0) {
      await this.prisma.batchInspection.update({
        where: { id: batchId },
        data: {
          status: BatchInspectionStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    }
  }

  /**
   * Verify apiary ownership
   */
  private async verifyApiaryOwnership(
    apiaryId: string,
    userId: string,
  ): Promise<void> {
    const apiary = await this.prisma.apiary.findFirst({
      where: { id: apiaryId, userId },
    });

    if (!apiary) {
      throw new ForbiddenException('Apiary not found or access denied');
    }
  }

  /**
   * Get batch and verify ownership
   */
  private async getBatchAndVerifyOwnership(
    batchId: string,
    apiaryId: string,
    userId: string,
  ) {
    await this.verifyApiaryOwnership(apiaryId, userId);

    const batch = await this.prisma.batchInspection.findFirst({
      where: { id: batchId, apiaryId },
    });

    if (!batch) {
      throw new NotFoundException('Batch inspection not found');
    }

    return batch;
  }

  /**
   * Map database model to response DTO
   */
  private mapToResponse(batch: any): BatchInspectionResponse {
    const hives = batch.hives || [];
    const completed = hives.filter(
      (h) => h.status === BatchHiveStatus.COMPLETED,
    ).length;
    const pending = hives.filter(
      (h) => h.status === BatchHiveStatus.PENDING,
    ).length;
    const cancelled = hives.filter(
      (h) => h.status === BatchHiveStatus.CANCELLED,
    ).length;

    let elapsedMinutes: number | null = null;
    let averageMinutesPerHive: number | null = null;
    let estimatedRemainingMinutes: number | null = null;

    if (batch.startedAt) {
      const elapsed = Date.now() - batch.startedAt.getTime();
      elapsedMinutes = Math.floor(elapsed / 60000);

      if (completed > 0) {
        averageMinutesPerHive = elapsedMinutes / completed;
        estimatedRemainingMinutes = Math.ceil(
          averageMinutesPerHive * pending,
        );
      }
    }

    return {
      id: batch.id,
      name: batch.name,
      apiaryId: batch.apiaryId,
      status: batch.status,
      startedAt: batch.startedAt?.toISOString() || null,
      completedAt: batch.completedAt?.toISOString() || null,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
      hives: hives.map((h) => ({
        id: h.id,
        hiveId: h.hiveId,
        order: h.order,
        status: h.status,
        inspectionId: h.inspectionId,
        completedAt: h.completedAt?.toISOString() || null,
        skippedCount: h.skippedCount,
        hive: h.hive,
      })),
      progress: {
        total: hives.length,
        completed,
        pending,
        cancelled,
        elapsedMinutes,
        averageMinutesPerHive,
        estimatedRemainingMinutes,
      },
    };
  }
}
