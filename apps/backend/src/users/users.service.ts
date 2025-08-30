import { Injectable, NotFoundException } from '@nestjs/common';
import { User, BoxType, HiveStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentSettingsDto, InventoryDto, EquipmentPlanDto, EquipmentCounts } from './dto';

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
    };
  }
}
