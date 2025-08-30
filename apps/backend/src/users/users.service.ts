import { Injectable, NotFoundException } from '@nestjs/common';
import { User, BoxType, HiveStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentSettingsDto, InventoryDto, EquipmentPlanDto, EquipmentCounts, ConsumableItem, CustomEquipmentItem, CustomEquipmentTypeDto, CreateCustomEquipmentTypeDto } from './dto';

type PartialUser = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }

  async create(data: { email: string; password: string; name?: string }) {
    return this.prismaService.user.create({ data });
  }

  async findAll(): Promise<PartialUser[]> {
    const users = await this.prismaService.user.findMany();

    // Exclude the password field from the response
    return users.map(({ password: _, ...userData }) => userData);
  }

  async resetPassword(
    userId: string,
    tempPassword: string,
  ): Promise<PartialUser> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update the user with the new password and set passwordChangeRequired to true
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordChangeRequired: true,
      },
    });

    // Exclude the password field from the response
    const { password: _pw, ...userData } = updatedUser;
    return userData;
  }

  async changePassword(
    userId: string,
    newPassword: string,
  ): Promise<PartialUser> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user with the new password and set passwordChangeRequired to false
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordChangeRequired: false,
      },
    });

    // Exclude the password field from the response
    const { password: _pw, ...userData } = updatedUser;
    return userData;
  }

  async getEquipmentSettings(userId: string): Promise<EquipmentSettingsDto> {
    const settings = await this.prismaService.userEquipmentSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings if they don't exist
      const defaultSettings = await this.prismaService.userEquipmentSettings.create({
        data: { userId },
      });
      return this.mapToEquipmentSettingsDto(defaultSettings);
    }

    return this.mapToEquipmentSettingsDto(settings);
  }

  async updateEquipmentSettings(userId: string, dto: EquipmentSettingsDto): Promise<EquipmentSettingsDto> {
    const settings = await this.prismaService.userEquipmentSettings.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });

    return this.mapToEquipmentSettingsDto(settings);
  }

  async getInventory(userId: string): Promise<InventoryDto> {
    const inventory = await this.prismaService.userInventory.findUnique({
      where: { userId },
    });

    if (!inventory) {
      // Create default inventory if it doesn't exist
      const defaultInventory = await this.prismaService.userInventory.create({
        data: { userId },
      });
      return this.mapToInventoryDto(defaultInventory);
    }

    return this.mapToInventoryDto(inventory);
  }

  async updateInventory(userId: string, dto: InventoryDto): Promise<InventoryDto> {
    const inventory = await this.prismaService.userInventory.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });

    return this.mapToInventoryDto(inventory);
  }

  async getEquipmentPlan(userId: string): Promise<EquipmentPlanDto> {
    const settings = await this.getEquipmentSettings(userId);
    const inventory = await this.getInventory(userId);

    // Get current hives count and equipment in use
    const userApiaries = await this.prismaService.apiary.findMany({
      where: { userId },
      include: {
        hives: {
          where: { status: HiveStatus.ACTIVE },
          include: { boxes: true },
        },
      },
    });

    const currentHives = userApiaries.reduce((total, apiary) => total + apiary.hives.length, 0);
    const targetHives = Math.ceil(currentHives * settings.targetMultiplier);

    // Calculate equipment in use
    const inUse = this.calculateEquipmentInUse(userApiaries);

    // Calculate recommended requirements (always based on settings)
    const recommended: EquipmentCounts = {
      deepBoxes: targetHives * settings.deepBoxesPerHive,
      shallowBoxes: targetHives * settings.shallowBoxesPerHive,
      bottoms: targetHives * settings.bottomsPerHive,
      covers: targetHives * settings.coversPerHive,
      frames: targetHives * settings.framesPerHive,
      queenExcluders: targetHives * settings.queenExcludersPerHive,
      feeders: targetHives * settings.feedersPerHive,
    };

    // Apply overrides to get actual required values
    const required: EquipmentCounts = {
      deepBoxes: inventory.requiredDeepBoxesOverride ?? recommended.deepBoxes,
      shallowBoxes: inventory.requiredShallowBoxesOverride ?? recommended.shallowBoxes,
      bottoms: inventory.requiredBottomsOverride ?? recommended.bottoms,
      covers: inventory.requiredCoversOverride ?? recommended.covers,
      frames: inventory.requiredFramesOverride ?? recommended.frames,
      queenExcluders: inventory.requiredQueenExcludersOverride ?? recommended.queenExcluders,
      feeders: inventory.requiredFeedersOverride ?? recommended.feeders,
    };

    // Check if any overrides are active
    const hasOverrides = !!(
      inventory.requiredDeepBoxesOverride !== null ||
      inventory.requiredShallowBoxesOverride !== null ||
      inventory.requiredBottomsOverride !== null ||
      inventory.requiredCoversOverride !== null ||
      inventory.requiredFramesOverride !== null ||
      inventory.requiredQueenExcludersOverride !== null ||
      inventory.requiredFeedersOverride !== null
    );

    const extra: EquipmentCounts = {
      deepBoxes: inventory.extraDeepBoxes,
      shallowBoxes: inventory.extraShallowBoxes,
      bottoms: inventory.extraBottoms,
      covers: inventory.extraCovers,
      frames: inventory.extraFrames,
      queenExcluders: inventory.extraQueenExcluders,
      feeders: inventory.extraFeeders,
    };

    const total: EquipmentCounts = {
      deepBoxes: inUse.deepBoxes + extra.deepBoxes,
      shallowBoxes: inUse.shallowBoxes + extra.shallowBoxes,
      bottoms: inUse.bottoms + extra.bottoms,
      covers: inUse.covers + extra.covers,
      frames: inUse.frames + extra.frames,
      queenExcluders: inUse.queenExcluders + extra.queenExcluders,
      feeders: inUse.feeders + extra.feeders,
    };

    const needed: EquipmentCounts = {
      deepBoxes: Math.max(0, required.deepBoxes - total.deepBoxes),
      shallowBoxes: Math.max(0, required.shallowBoxes - total.shallowBoxes),
      bottoms: Math.max(0, required.bottoms - total.bottoms),
      covers: Math.max(0, required.covers - total.covers),
      frames: Math.max(0, required.frames - total.frames),
      queenExcluders: Math.max(0, required.queenExcluders - total.queenExcluders),
      feeders: Math.max(0, required.feeders - total.feeders),
    };

    // Calculate consumables
    const consumables: any = {};
    
    if (settings.trackSugar) {
      const sugarRecommended = targetHives * settings.sugarPerHive;
      const sugarRequired = inventory.requiredSugarKgOverride ?? sugarRecommended;
      const sugarExtra = inventory.extraSugarKg || 0;
      
      consumables.sugar = {
        name: 'Sugar',
        unit: 'kg',
        inUse: 0, // Consumables don't have "in use"
        extra: sugarExtra,
        total: sugarExtra,
        required: sugarRequired,
        recommended: sugarRecommended,
        needed: Math.max(0, sugarRequired - sugarExtra),
        perHive: settings.sugarPerHive,
      };
    }
    
    if (settings.trackSyrup) {
      const syrupRecommended = targetHives * settings.syrupPerHive;
      const syrupRequired = inventory.requiredSyrupLitersOverride ?? syrupRecommended;
      const syrupExtra = inventory.extraSyrupLiters || 0;
      
      consumables.syrup = {
        name: 'Syrup',
        unit: 'liters',
        inUse: 0,
        extra: syrupExtra,
        total: syrupExtra,
        required: syrupRequired,
        recommended: syrupRecommended,
        needed: Math.max(0, syrupRequired - syrupExtra),
        perHive: settings.syrupPerHive,
      };
    }

    // Get custom equipment types and calculate
    const customEquipmentTypes = await this.prismaService.customEquipmentType.findMany({
      where: { userId, isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    const customEquipment: CustomEquipmentItem[] = [];
    const customData = inventory.customEquipment as any || {};

    for (const customType of customEquipmentTypes) {
      const itemData = customData[customType.id] || { extra: 0, requiredOverride: null };
      const recommended = customType.perHiveRatio ? targetHives * customType.perHiveRatio : 0;
      const required = itemData.requiredOverride ?? recommended;
      const extra = itemData.extra || 0;

      customEquipment.push({
        id: customType.id,
        name: customType.name,
        unit: customType.unit,
        category: customType.category,
        inUse: 0, // Custom equipment typically doesn't track "in use"
        extra,
        total: extra,
        required,
        recommended,
        needed: Math.max(0, required - extra),
        perHive: customType.perHiveRatio || 0,
      });
    }

    return {
      currentHives,
      targetHives,
      inUse,
      extra,
      total,
      required,
      recommended,
      needed,
      hasOverrides,
      consumables,
      customEquipment,
    };
  }

  private calculateEquipmentInUse(apiaries: any[]): EquipmentCounts {
    let deepBoxes = 0;
    let shallowBoxes = 0;
    let frames = 0;
    let queenExcluders = 0;

    apiaries.forEach(apiary => {
      apiary.hives.forEach(hive => {
        // Count active hive bottoms and covers (1 per hive)
        // Count boxes by type
        hive.boxes.forEach(box => {
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

    return {
      deepBoxes,
      shallowBoxes,
      bottoms: apiaries.reduce((total, apiary) => total + apiary.hives.length, 0), // 1 per hive
      covers: apiaries.reduce((total, apiary) => total + apiary.hives.length, 0), // 1 per hive
      frames,
      queenExcluders,
      feeders: 0, // Not tracked in current box model
    };
  }

  private mapToEquipmentSettingsDto(settings: any): EquipmentSettingsDto {
    return {
      trackDeepBoxes: settings.trackDeepBoxes,
      trackShallowBoxes: settings.trackShallowBoxes,
      trackBottoms: settings.trackBottoms,
      trackCovers: settings.trackCovers,
      trackFrames: settings.trackFrames,
      trackQueenExcluders: settings.trackQueenExcluders,
      trackFeeders: settings.trackFeeders,
      deepBoxesPerHive: settings.deepBoxesPerHive,
      shallowBoxesPerHive: settings.shallowBoxesPerHive,
      framesPerHive: settings.framesPerHive,
      bottomsPerHive: settings.bottomsPerHive,
      coversPerHive: settings.coversPerHive,
      queenExcludersPerHive: settings.queenExcludersPerHive,
      feedersPerHive: settings.feedersPerHive,
      targetMultiplier: settings.targetMultiplier,
      // Consumables
      trackSugar: settings.trackSugar,
      sugarPerHive: settings.sugarPerHive,
      trackSyrup: settings.trackSyrup,
      syrupPerHive: settings.syrupPerHive,
    };
  }

  private mapToInventoryDto(inventory: any): InventoryDto {
    return {
      extraDeepBoxes: inventory.extraDeepBoxes,
      extraShallowBoxes: inventory.extraShallowBoxes,
      extraBottoms: inventory.extraBottoms,
      extraCovers: inventory.extraCovers,
      extraFrames: inventory.extraFrames,
      extraQueenExcluders: inventory.extraQueenExcluders,
      extraFeeders: inventory.extraFeeders,
      requiredDeepBoxesOverride: inventory.requiredDeepBoxesOverride,
      requiredShallowBoxesOverride: inventory.requiredShallowBoxesOverride,
      requiredBottomsOverride: inventory.requiredBottomsOverride,
      requiredCoversOverride: inventory.requiredCoversOverride,
      requiredFramesOverride: inventory.requiredFramesOverride,
      requiredQueenExcludersOverride: inventory.requiredQueenExcludersOverride,
      requiredFeedersOverride: inventory.requiredFeedersOverride,
      // Consumables
      extraSugarKg: inventory.extraSugarKg || 0,
      requiredSugarKgOverride: inventory.requiredSugarKgOverride,
      extraSyrupLiters: inventory.extraSyrupLiters || 0,
      requiredSyrupLitersOverride: inventory.requiredSyrupLitersOverride,
      // Custom equipment
      customEquipment: inventory.customEquipment,
    };
  }

  // Custom equipment management methods
  async getCustomEquipmentTypes(userId: string): Promise<CustomEquipmentTypeDto[]> {
    const customTypes = await this.prismaService.customEquipmentType.findMany({
      where: { userId },
      orderBy: { displayOrder: 'asc' },
    });

    return customTypes.map(type => ({
      id: type.id,
      name: type.name,
      unit: type.unit,
      category: type.category,
      perHiveRatio: type.perHiveRatio,
      isActive: type.isActive,
      displayOrder: type.displayOrder,
    }));
  }

  async createCustomEquipmentType(userId: string, data: CreateCustomEquipmentTypeDto): Promise<CustomEquipmentTypeDto> {
    const customType = await this.prismaService.customEquipmentType.create({
      data: {
        userId,
        name: data.name,
        unit: data.unit,
        category: data.category || 'custom',
        perHiveRatio: data.perHiveRatio,
        displayOrder: data.displayOrder || 999,
      },
    });

    return {
      id: customType.id,
      name: customType.name,
      unit: customType.unit,
      category: customType.category,
      perHiveRatio: customType.perHiveRatio,
      isActive: customType.isActive,
      displayOrder: customType.displayOrder,
    };
  }

  async updateCustomEquipmentType(userId: string, id: string, data: Partial<CreateCustomEquipmentTypeDto>): Promise<CustomEquipmentTypeDto> {
    const customType = await this.prismaService.customEquipmentType.updateMany({
      where: { id, userId }, // Ensure user owns this custom type
      data: {
        name: data.name,
        unit: data.unit,
        category: data.category,
        perHiveRatio: data.perHiveRatio,
        displayOrder: data.displayOrder,
      },
    });

    const updatedType = await this.prismaService.customEquipmentType.findFirst({
      where: { id, userId },
    });

    if (!updatedType) {
      throw new NotFoundException('Custom equipment type not found');
    }

    return {
      id: updatedType.id,
      name: updatedType.name,
      unit: updatedType.unit,
      category: updatedType.category,
      perHiveRatio: updatedType.perHiveRatio,
      isActive: updatedType.isActive,
      displayOrder: updatedType.displayOrder,
    };
  }

  async deleteCustomEquipmentType(userId: string, id: string): Promise<void> {
    await this.prismaService.customEquipmentType.deleteMany({
      where: { id, userId }, // Ensure user owns this custom type
    });
  }

  async toggleCustomEquipmentType(userId: string, id: string, isActive: boolean): Promise<CustomEquipmentTypeDto> {
    await this.prismaService.customEquipmentType.updateMany({
      where: { id, userId },
      data: { isActive },
    });

    const updatedType = await this.prismaService.customEquipmentType.findFirst({
      where: { id, userId },
    });

    if (!updatedType) {
      throw new NotFoundException('Custom equipment type not found');
    }

    return {
      id: updatedType.id,
      name: updatedType.name,
      unit: updatedType.unit,
      category: updatedType.category,
      perHiveRatio: updatedType.perHiveRatio,
      isActive: updatedType.isActive,
      displayOrder: updatedType.displayOrder,
    };
  }
}
