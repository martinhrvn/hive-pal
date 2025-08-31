import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EquipmentItem,
  BoxType,
  HiveStatus,
  Apiary,
  Hive,
  Box,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  EquipmentItemWithCalculations,
  EquipmentMultiplier as EquipmentMultiplierDto,
  EquipmentPlan as EquipmentPlanDto,
  CreateEquipmentItem as CreateEquipmentItemDto,
  UpdateEquipmentItem as UpdateEquipmentItemDto,
  EquipmentCategory,
} from 'shared-schemas';

// Type definitions for nested Prisma relations
type ApiaryWithHives = Apiary & {
  hives: (Hive & {
    boxes: Box[];
  })[];
};

@Injectable()
export class EquipmentService {
  constructor(private prismaService: PrismaService) {}

  async getEquipmentItems(
    userId: string,
  ): Promise<EquipmentItemWithCalculations[]> {
    const items = await this.prismaService.equipmentItem.findMany({
      where: { userId },
      orderBy: { displayOrder: 'asc' },
    });

    // Default items should be created by database trigger when user is created

    return items.map((item) => this.mapToEquipmentItemDto(item));
  }

  async getEquipmentItem(
    userId: string,
    itemId: string,
  ): Promise<EquipmentItemWithCalculations> {
    const item = await this.prismaService.equipmentItem.findUnique({
      where: {
        userId_itemId: {
          userId,
          itemId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Equipment item ${itemId} not found`);
    }

    return this.mapToEquipmentItemDto(item);
  }

  async updateEquipmentItem(
    userId: string,
    itemId: string,
    data: UpdateEquipmentItemDto,
  ): Promise<EquipmentItemWithCalculations> {
    const item = await this.prismaService.equipmentItem.update({
      where: {
        userId_itemId: {
          userId,
          itemId,
        },
      },
      data: {
        name: data.name,
        enabled: data.enabled,
        perHive: data.perHive,
        extra: data.extra,
        neededOverride: data.neededOverride,
        unit: data.unit,
        displayOrder: data.displayOrder,
      },
    });

    return this.mapToEquipmentItemDto(item);
  }

  async createEquipmentItem(
    userId: string,
    data: CreateEquipmentItemDto,
  ): Promise<EquipmentItemWithCalculations> {
    const item = await this.prismaService.equipmentItem.create({
      data: {
        userId,
        itemId: data.itemId,
        name: data.name || data.itemId,
        enabled: data.enabled ?? true,
        perHive: data.perHive ?? 0,
        extra: data.extra ?? 0,
        neededOverride: data.neededOverride ?? null,
        category: data.category,
        unit: data.unit ?? 'pieces',
        isCustom: true,
        displayOrder: data.displayOrder ?? 999,
      },
    });

    return this.mapToEquipmentItemDto(item);
  }

  async deleteEquipmentItem(userId: string, itemId: string): Promise<void> {
    // Only allow deletion of custom items
    const item = await this.prismaService.equipmentItem.findUnique({
      where: {
        userId_itemId: {
          userId,
          itemId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Equipment item ${itemId} not found`);
    }

    if (!item.isCustom) {
      throw new Error('Cannot delete standard equipment items');
    }

    await this.prismaService.equipmentItem.delete({
      where: {
        userId_itemId: {
          userId,
          itemId,
        },
      },
    });
  }

  async getEquipmentMultiplier(
    userId: string,
  ): Promise<EquipmentMultiplierDto> {
    let multiplier = await this.prismaService.equipmentMultiplier.findUnique({
      where: { userId },
    });

    if (!multiplier) {
      // Create default multiplier
      multiplier = await this.prismaService.equipmentMultiplier.create({
        data: {
          userId,
          targetMultiplier: 1.5,
        },
      });
    }

    return {
      targetMultiplier: multiplier.targetMultiplier ?? 1.5,
    };
  }

  async updateEquipmentMultiplier(
    userId: string,
    targetMultiplier: number,
  ): Promise<EquipmentMultiplierDto> {
    const multiplier = await this.prismaService.equipmentMultiplier.upsert({
      where: { userId },
      create: {
        userId,
        targetMultiplier,
      },
      update: {
        targetMultiplier,
      },
    });

    return {
      targetMultiplier: multiplier.targetMultiplier,
    };
  }

  async getEquipmentPlan(userId: string): Promise<EquipmentPlanDto> {
    // Get all equipment items and multiplier
    const items = await this.getEquipmentItems(userId);
    const multiplier = await this.getEquipmentMultiplier(userId);

    // Get current hives count and equipment in use
    const userApiaries: ApiaryWithHives[] =
      await this.prismaService.apiary.findMany({
        where: { userId },
        include: {
          hives: {
            where: { status: HiveStatus.ACTIVE },
            include: { boxes: true },
          },
        },
      });

    const currentHives = userApiaries.reduce(
      (total, apiary) => total + apiary.hives.length,
      0,
    );
    const targetHives = Math.ceil(currentHives * multiplier.targetMultiplier);

    // Calculate equipment in use
    const inUse = this.calculateEquipmentInUse(userApiaries);

    // Process each equipment item with calculations
    const processedItems: EquipmentItemWithCalculations[] = items.map(
      (item) => {
        // Get in-use count for this item
        let itemInUse = 0;
        if (item.itemId === 'DEEP_BOX') {
          itemInUse = inUse.deepBoxes;
        } else if (item.itemId === 'SHALLOW_BOX') {
          itemInUse = inUse.shallowBoxes;
        } else if (item.itemId === 'BOTTOM_BOARD') {
          itemInUse = inUse.bottoms;
        } else if (item.itemId === 'COVER') {
          itemInUse = inUse.covers;
        } else if (item.itemId === 'FRAMES') {
          itemInUse = inUse.frames;
        } else if (item.itemId === 'QUEEN_EXCLUDER') {
          itemInUse = inUse.queenExcluders;
        }

        // Calculate recommended based on target hives
        let recommended = targetHives * item.perHive;

        // Special calculation for frames based on boxes
        if (item.itemId === 'FRAMES') {
          const deepBoxItem = items.find((i) => i.itemId === 'DEEP_BOX');
          const shallowBoxItem = items.find((i) => i.itemId === 'SHALLOW_BOX');
          const deepBoxesNeeded = targetHives * (deepBoxItem?.perHive || 1);
          const shallowBoxesNeeded =
            targetHives * (shallowBoxItem?.perHive || 2);
          // Assume 10 frames per deep box, 10 frames per shallow box
          recommended = deepBoxesNeeded * 10 + shallowBoxesNeeded * 10;
        }

        // Use override if set, otherwise use recommended
        const required = item.neededOverride ?? recommended;

        // Calculate total and needed
        const total = itemInUse + item.extra;
        const needed = Math.max(0, required - total);

        return {
          ...item,
          inUse: itemInUse,
          total,
          required,
          recommended,
          needed,
        };
      },
    );

    // Check if any overrides are active
    const hasOverrides = processedItems.some(
      (item) => item.neededOverride !== null,
    );

    return {
      currentHives,
      targetHives,
      items: processedItems,
      hasOverrides,
    };
  }

  private calculateEquipmentInUse(apiaries: ApiaryWithHives[]): {
    deepBoxes: number;
    shallowBoxes: number;
    bottoms: number;
    covers: number;
    frames: number;
    queenExcluders: number;
    feeders: number;
  } {
    let deepBoxes = 0;
    let shallowBoxes = 0;
    let frames = 0;
    let queenExcluders = 0;

    apiaries.forEach((apiary) => {
      apiary.hives.forEach((hive) => {
        hive.boxes.forEach((box) => {
          if (box.type === BoxType.BROOD) {
            deepBoxes++;
          } else if (box.type === BoxType.HONEY) {
            shallowBoxes++;
          }
          frames += box.frameCount;
          if (box.hasExcluder) {
            queenExcluders++;
          }
        });
      });
    });

    const totalHives = apiaries.reduce(
      (total, apiary) => total + apiary.hives.length,
      0,
    );

    return {
      deepBoxes,
      shallowBoxes,
      bottoms: totalHives, // 1 per hive
      covers: totalHives, // 1 per hive
      frames,
      queenExcluders,
      feeders: 0, // Not tracked in current box model
    };
  }

  private mapToEquipmentItemDto(
    item: EquipmentItem,
  ): EquipmentItemWithCalculations {
    return {
      id: item.id,
      itemId: item.itemId,
      name: item.name,
      enabled: item.enabled,
      perHive: item.perHive,
      extra: item.extra,
      neededOverride: item.neededOverride,
      category: item.category as EquipmentCategory,
      unit: item.unit,
      isCustom: item.isCustom,
      displayOrder: item.displayOrder,
    };
  }
}
