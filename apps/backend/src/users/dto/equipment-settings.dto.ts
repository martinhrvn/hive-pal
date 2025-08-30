import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class EquipmentCounts {
  @ApiProperty({ description: 'Deep boxes count' })
  deepBoxes: number;

  @ApiProperty({ description: 'Shallow boxes count' })
  shallowBoxes: number;

  @ApiProperty({ description: 'Bottom boards count' })
  bottoms: number;

  @ApiProperty({ description: 'Covers count' })
  covers: number;

  @ApiProperty({ description: 'Frames count' })
  frames: number;

  @ApiProperty({ description: 'Queen excluders count' })
  queenExcluders: number;

  @ApiProperty({ description: 'Feeders count' })
  feeders: number;
}

export class EquipmentSettingsDto {
  @ApiProperty({ description: 'Track deep boxes', default: true })
  @IsBoolean()
  trackDeepBoxes: boolean;

  @ApiProperty({ description: 'Track shallow/honey boxes', default: true })
  @IsBoolean()
  trackShallowBoxes: boolean;

  @ApiProperty({ description: 'Track bottom boards', default: true })
  @IsBoolean()
  trackBottoms: boolean;

  @ApiProperty({ description: 'Track top covers', default: true })
  @IsBoolean()
  trackCovers: boolean;

  @ApiProperty({ description: 'Track frames', default: true })
  @IsBoolean()
  trackFrames: boolean;

  @ApiProperty({ description: 'Track queen excluders', default: true })
  @IsBoolean()
  trackQueenExcluders: boolean;

  @ApiProperty({ description: 'Track feeders', default: false })
  @IsBoolean()
  trackFeeders: boolean;

  @ApiProperty({ description: 'Number of deep boxes per hive', default: 1 })
  @IsInt()
  @Min(0)
  deepBoxesPerHive: number;

  @ApiProperty({ description: 'Number of shallow boxes per hive', default: 2 })
  @IsInt()
  @Min(0)
  shallowBoxesPerHive: number;

  @ApiProperty({ description: 'Number of frames per hive', default: 20 })
  @IsInt()
  @Min(0)
  framesPerHive: number;

  @ApiProperty({ description: 'Number of bottom boards per hive', default: 1 })
  @IsInt()
  @Min(0)
  bottomsPerHive: number;

  @ApiProperty({ description: 'Number of covers per hive', default: 1 })
  @IsInt()
  @Min(0)
  coversPerHive: number;

  @ApiProperty({
    description: 'Number of queen excluders per hive',
    default: 1,
  })
  @IsInt()
  @Min(0)
  queenExcludersPerHive: number;

  @ApiProperty({ description: 'Number of feeders per hive', default: 0 })
  @IsInt()
  @Min(0)
  feedersPerHive: number;

  @ApiProperty({
    description: 'Target multiplier for seasonal planning',
    default: 1.5,
  })
  @IsNumber()
  @Min(1)
  targetMultiplier: number;

  @ApiProperty({ description: 'Track sugar consumption', default: true })
  @IsBoolean()
  trackSugar: boolean;

  @ApiProperty({ description: 'Sugar per hive in kg', default: 12.0 })
  @IsNumber()
  @Min(0)
  sugarPerHive: number;

  @ApiProperty({ description: 'Track syrup consumption', default: false })
  @IsBoolean()
  trackSyrup: boolean;

  @ApiProperty({ description: 'Syrup per hive in liters', default: 0.0 })
  @IsNumber()
  @Min(0)
  syrupPerHive: number;
}

export class InventoryDto {
  @ApiProperty({ description: 'Extra deep boxes count', default: 0 })
  @IsInt()
  @Min(0)
  extraDeepBoxes: number;

  @ApiProperty({ description: 'Extra shallow boxes count', default: 0 })
  @IsInt()
  @Min(0)
  extraShallowBoxes: number;

  @ApiProperty({ description: 'Extra bottom boards count', default: 0 })
  @IsInt()
  @Min(0)
  extraBottoms: number;

  @ApiProperty({ description: 'Extra covers count', default: 0 })
  @IsInt()
  @Min(0)
  extraCovers: number;

  @ApiProperty({ description: 'Extra frames count', default: 0 })
  @IsInt()
  @Min(0)
  extraFrames: number;

  @ApiProperty({ description: 'Extra queen excluders count', default: 0 })
  @IsInt()
  @Min(0)
  extraQueenExcluders: number;

  @ApiProperty({ description: 'Extra feeders count', default: 0 })
  @IsInt()
  @Min(0)
  extraFeeders: number;

  // Manual overrides for required equipment
  @ApiProperty({ description: 'Override for required deep boxes', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  requiredDeepBoxesOverride?: number | null;

  @ApiProperty({ description: 'Override for required shallow boxes', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  requiredShallowBoxesOverride?: number | null;

  @ApiProperty({ description: 'Override for required bottoms', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  requiredBottomsOverride?: number | null;

  @ApiProperty({ description: 'Override for required covers', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  requiredCoversOverride?: number | null;

  @ApiProperty({ description: 'Override for required frames', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  requiredFramesOverride?: number | null;

  @ApiProperty({ description: 'Override for required queen excluders', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  requiredQueenExcludersOverride?: number | null;

  @ApiProperty({ description: 'Override for required feeders', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  requiredFeedersOverride?: number | null;

  // Built-in consumables
  @ApiProperty({ description: 'Extra sugar in kg', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  extraSugarKg?: number;

  @ApiProperty({ description: 'Override for required sugar in kg', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  requiredSugarKgOverride?: number | null;

  @ApiProperty({ description: 'Extra syrup in liters', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  extraSyrupLiters?: number;

  @ApiProperty({ description: 'Override for required syrup in liters', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  requiredSyrupLitersOverride?: number | null;

  // Custom equipment as JSON
  @ApiProperty({ description: 'Custom equipment data as JSON', required: false })
  @IsOptional()
  customEquipment?: any;
}

export class CustomEquipmentTypeDto {
  @ApiProperty({ description: 'Custom equipment type ID' })
  id: string;

  @ApiProperty({ description: 'Equipment name' })
  name: string;

  @ApiProperty({ description: 'Unit of measurement' })
  unit: string;

  @ApiProperty({ description: 'Equipment category' })
  category: string;

  @ApiProperty({ description: 'Amount per hive for calculations', required: false })
  perHiveRatio?: number | null;

  @ApiProperty({ description: 'Whether this equipment is active/tracked' })
  isActive: boolean;

  @ApiProperty({ description: 'Display order' })
  displayOrder: number;
}

export class CreateCustomEquipmentTypeDto {
  @ApiProperty({ description: 'Equipment name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Unit of measurement' })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Equipment category', default: 'custom' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Amount per hive for calculations', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  perHiveRatio?: number | null;

  @ApiProperty({ description: 'Display order', default: 999 })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}

export class ConsumableItem {
  @ApiProperty({ description: 'Item name' })
  name: string;

  @ApiProperty({ description: 'Unit of measurement' })
  unit: string;

  @ApiProperty({ description: 'Amount in use (always 0 for consumables)' })
  inUse: number;

  @ApiProperty({ description: 'Extra inventory amount' })
  extra: number;

  @ApiProperty({ description: 'Total available' })
  total: number;

  @ApiProperty({ description: 'Required amount' })
  required: number;

  @ApiProperty({ description: 'Recommended amount based on calculations' })
  recommended: number;

  @ApiProperty({ description: 'Amount needed' })
  needed: number;

  @ApiProperty({ description: 'Per hive ratio' })
  perHive: number;
}

export class CustomEquipmentItem extends ConsumableItem {
  @ApiProperty({ description: 'Custom equipment type ID' })
  id: string;

  @ApiProperty({ description: 'Category' })
  category: string;
}

export class EquipmentPlanDto {
  @ApiProperty({ description: 'Current active hive count' })
  currentHives: number;

  @ApiProperty({ description: 'Target hive count for planning' })
  targetHives: number;

  @ApiProperty({ description: 'Equipment currently in use' })
  inUse: EquipmentCounts;

  @ApiProperty({ description: 'Extra inventory' })
  extra: EquipmentCounts;

  @ApiProperty({ description: 'Total current equipment' })
  total: EquipmentCounts;

  @ApiProperty({ description: 'Required equipment for target hives (with overrides applied)' })
  required: EquipmentCounts;

  @ApiProperty({ description: 'Recommended equipment based on calculations' })
  recommended: EquipmentCounts;

  @ApiProperty({ description: 'Equipment needed (shopping list)' })
  needed: EquipmentCounts;

  @ApiProperty({ description: 'Whether any overrides are active' })
  hasOverrides: boolean;

  @ApiProperty({ description: 'Consumables (sugar, syrup, etc.)' })
  consumables: {
    sugar?: ConsumableItem;
    syrup?: ConsumableItem;
  };

  @ApiProperty({ description: 'Custom equipment items', type: [CustomEquipmentItem] })
  customEquipment: CustomEquipmentItem[];
}
