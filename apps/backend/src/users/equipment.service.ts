import { Injectable, NotFoundException } from '@nestjs/common';
import { EquipmentItem, HiveStatus, Apiary, Hive, Box } from '@/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  EquipmentItemWithCalculations,
  EquipmentMultiplier as EquipmentMultiplierDto,
  EquipmentPlan as EquipmentPlanDto,
  CreateEquipmentItem as CreateEquipmentItemDto,
  UpdateEquipmentItem as UpdateEquipmentItemDto,
  EquipmentCategory,
  EquipmentScope,
  BoxVariantEnum,
  SHARED_SCOPE_CATEGORIES,
} from 'shared-schemas';

// Type definitions for nested Prisma relations
type ApiaryWithHives = Apiary & {
  hives: (Hive & {
    boxes: Box[];
  })[];
};

// Prisma EquipmentItem extended with fields added in our migrations.
// These are present at runtime after `prisma generate` runs in the build.
type EquipmentItemFull = EquipmentItem & {
  inExtraction: number;
  damaged: number;
  scope: 'PER_HIVE' | 'SHARED';
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
        inExtraction: data.inExtraction,
        damaged: data.damaged,
        neededOverride: data.neededOverride,
        unit: data.unit,
        displayOrder: data.displayOrder,
        scope: data.scope,
      },
    });

    return this.mapToEquipmentItemDto(item);
  }

  async createEquipmentItem(
    userId: string,
    data: CreateEquipmentItemDto,
  ): Promise<EquipmentItemWithCalculations> {
    const defaultScope = SHARED_SCOPE_CATEGORIES.has(data.category)
      ? 'SHARED'
      : 'PER_HIVE';

    const item = await this.prismaService.equipmentItem.create({
      data: {
        userId,
        itemId: data.itemId,
        name: data.name || data.itemId,
        enabled: data.enabled ?? true,
        perHive: data.perHive ?? 0,
        extra: data.extra ?? 0,
        inExtraction: data.inExtraction ?? 0,
        damaged: data.damaged ?? 0,
        neededOverride: data.neededOverride ?? null,
        category: data.category,
        scope: (data.scope ?? defaultScope) as 'PER_HIVE' | 'SHARED',
        unit: data.unit ?? 'pieces',
        isCustom: true,
        displayOrder: data.displayOrder ?? 999,
      },
    });

    return this.mapToEquipmentItemDto(item);
  }

  async deleteEquipmentItem(userId: string, itemId: string): Promise<void> {
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
      multiplier = await this.prismaService.equipmentMultiplier.create({
        data: {
          userId,
          targetHives: 0,
        },
      });
    }

    return {
      targetHives: multiplier.targetHives ?? 0,
    };
  }

  async updateEquipmentMultiplier(
    userId: string,
    targetHives: number,
  ): Promise<EquipmentMultiplierDto> {
    const multiplier = await this.prismaService.equipmentMultiplier.upsert({
      where: { userId },
      create: {
        userId,
        targetHives,
      },
      update: {
        targetHives,
      },
    });

    return {
      targetHives: multiplier.targetHives,
    };
  }

  async getEquipmentPlan(userId: string): Promise<EquipmentPlanDto> {
    const items = await this.getEquipmentItems(userId);
    const multiplier = await this.getEquipmentMultiplier(userId);

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

    const targetHives =
      multiplier.targetHives > 0 ? multiplier.targetHives : currentHives;

    const inUse = this.calculateEquipmentInUse(userApiaries);

    const processedItems: EquipmentItemWithCalculations[] = items.map(
      (item) => {
        let itemInUse = 0;
        if (item.itemId === 'DEEP_BOX') {
          itemInUse = inUse.deepBoxes;
        } else if (item.itemId === 'MEDIUM_BOX') {
          itemInUse = inUse.mediumBoxes;
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

        const isShared = item.scope === EquipmentScope.SHARED;
        const recommended = isShared
          ? item.perHive
          : targetHives * item.perHive;
        const needed = item.neededOverride ?? recommended;

        // Total available excludes damaged (not usable)
        const inExtraction = item.inExtraction ?? 0;
        const total = itemInUse + item.extra + inExtraction;
        const toPurchase = needed - total;

        return {
          ...item,
          inUse: itemInUse,
          total,
          needed,
          recommended,
          toPurchase,
        };
      },
    );

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
    mediumBoxes: number;
    shallowBoxes: number;
    bottoms: number;
    covers: number;
    frames: number;
    queenExcluders: number;
    feeders: number;
  } {
    let deepBoxes = 0;
    let mediumBoxes = 0;
    let shallowBoxes = 0;
    let frames = 0;
    let queenExcluders = 0;

    apiaries.forEach((apiary) => {
      apiary.hives.forEach((hive) => {
        hive.boxes.forEach((box) => {
          if (
            box.variant === BoxVariantEnum.B_DEEP ||
            box.variant === BoxVariantEnum.LANGSTROTH_DEEP ||
            box.variant === BoxVariantEnum.WARRE ||
            box.variant === BoxVariantEnum.NATIONAL_DEEP
          ) {
            deepBoxes++;
          } else if (box.variant === BoxVariantEnum.LANGSTROTH_MEDIUM) {
            mediumBoxes++;
          } else if (
            box.variant === BoxVariantEnum.B_SHALLOW ||
            box.variant === BoxVariantEnum.LANGSTROTH_SHALLOW ||
            box.variant === BoxVariantEnum.NATIONAL_SHALLOW
          ) {
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
      mediumBoxes,
      shallowBoxes,
      bottoms: totalHives,
      covers: totalHives,
      frames,
      queenExcluders,
      feeders: 0,
    };
  }

  private mapToEquipmentItemDto(
    item: EquipmentItemFull,
  ): EquipmentItemWithCalculations {
    return {
      id: item.id,
      itemId: item.itemId,
      name: item.name,
      enabled: item.enabled,
      perHive: item.perHive,
      extra: item.extra,
      inExtraction: item.inExtraction ?? 0,
      damaged: item.damaged ?? 0,
      neededOverride: item.neededOverride,
      category: item.category as EquipmentCategory,
      scope: (item.scope ?? 'PER_HIVE') as EquipmentScope,
      unit: item.unit,
      isCustom: item.isCustom,
      displayOrder: item.displayOrder,
    };
  }
}
