import { z } from 'zod';

// Equipment counts schema
export const equipmentCountsSchema = z.object({
  deepBoxes: z.number(),
  shallowBoxes: z.number(),
  bottoms: z.number(),
  covers: z.number(),
  frames: z.number(),
  queenExcluders: z.number(),
  feeders: z.number(),
});

// Equipment settings schema
export const equipmentSettingsSchema = z.object({
  trackDeepBoxes: z.boolean(),
  trackShallowBoxes: z.boolean(),
  trackBottoms: z.boolean(),
  trackCovers: z.boolean(),
  trackFrames: z.boolean(),
  trackQueenExcluders: z.boolean(),
  trackFeeders: z.boolean(),
  deepBoxesPerHive: z.number().int().min(0),
  shallowBoxesPerHive: z.number().int().min(0),
  framesPerHive: z.number().int().min(0),
  bottomsPerHive: z.number().int().min(0),
  coversPerHive: z.number().int().min(0),
  queenExcludersPerHive: z.number().int().min(0),
  feedersPerHive: z.number().int().min(0),
  targetMultiplier: z.number().min(1),
  trackSugar: z.boolean(),
  sugarPerHive: z.number().min(0),
  trackSyrup: z.boolean(),
  syrupPerHive: z.number().min(0),
});

// Inventory schema
export const inventorySchema = z.object({
  extraDeepBoxes: z.number().int().min(0),
  extraShallowBoxes: z.number().int().min(0),
  extraBottoms: z.number().int().min(0),
  extraCovers: z.number().int().min(0),
  extraFrames: z.number().int().min(0),
  extraQueenExcluders: z.number().int().min(0),
  extraFeeders: z.number().int().min(0),
  requiredDeepBoxesOverride: z.number().int().min(0).nullable().optional(),
  requiredShallowBoxesOverride: z.number().int().min(0).nullable().optional(),
  requiredBottomsOverride: z.number().int().min(0).nullable().optional(),
  requiredCoversOverride: z.number().int().min(0).nullable().optional(),
  requiredFramesOverride: z.number().int().min(0).nullable().optional(),
  requiredQueenExcludersOverride: z.number().int().min(0).nullable().optional(),
  requiredFeedersOverride: z.number().int().min(0).nullable().optional(),
  extraSugarKg: z.number().min(0).optional(),
  requiredSugarKgOverride: z.number().min(0).nullable().optional(),
  extraSyrupLiters: z.number().min(0).optional(),
  requiredSyrupLitersOverride: z.number().min(0).nullable().optional(),
  customEquipment: z.any().optional(),
});

// Custom equipment type schema
export const customEquipmentTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  category: z.string(),
  perHiveRatio: z.number().nullable().optional(),
  isActive: z.boolean(),
  displayOrder: z.number(),
});

// Create custom equipment type schema
export const createCustomEquipmentTypeSchema = z.object({
  name: z.string(),
  unit: z.string(),
  category: z.string().default('custom'),
  perHiveRatio: z.number().min(0).nullable().optional(),
  displayOrder: z.number().int().min(0).optional().default(999),
});

// Consumable item schema
export const consumableItemSchema = z.object({
  name: z.string(),
  unit: z.string(),
  inUse: z.number(),
  extra: z.number(),
  total: z.number(),
  required: z.number(),
  recommended: z.number(),
  needed: z.number(),
  perHive: z.number(),
});

// Custom equipment item schema
export const customEquipmentItemSchema = consumableItemSchema.extend({
  id: z.string(),
  category: z.string(),
});

// User equipment plan schema (renamed to avoid conflict)
export const userEquipmentPlanSchema = z.object({
  currentHives: z.number(),
  targetHives: z.number(),
  inUse: equipmentCountsSchema,
  extra: equipmentCountsSchema,
  total: equipmentCountsSchema,
  required: equipmentCountsSchema,
  recommended: equipmentCountsSchema,
  needed: equipmentCountsSchema,
  hasOverrides: z.boolean(),
  consumables: z.object({
    sugar: consumableItemSchema.optional(),
    syrup: consumableItemSchema.optional(),
  }),
  customEquipment: z.array(customEquipmentItemSchema),
});

// DTO Classes for Swagger/NestJS
export declare class EquipmentCountsDto {
  deepBoxes: number;
  shallowBoxes: number;
  bottoms: number;
  covers: number;
  frames: number;
  queenExcluders: number;
  feeders: number;
}

export declare class EquipmentSettingsDto {
  trackDeepBoxes: boolean;
  trackShallowBoxes: boolean;
  trackBottoms: boolean;
  trackCovers: boolean;
  trackFrames: boolean;
  trackQueenExcluders: boolean;
  trackFeeders: boolean;
  deepBoxesPerHive: number;
  shallowBoxesPerHive: number;
  framesPerHive: number;
  bottomsPerHive: number;
  coversPerHive: number;
  queenExcludersPerHive: number;
  feedersPerHive: number;
  targetMultiplier: number;
  trackSugar: boolean;
  sugarPerHive: number;
  trackSyrup: boolean;
  syrupPerHive: number;
}

export declare class InventoryDto {
  extraDeepBoxes: number;
  extraShallowBoxes: number;
  extraBottoms: number;
  extraCovers: number;
  extraFrames: number;
  extraQueenExcluders: number;
  extraFeeders: number;
  requiredDeepBoxesOverride?: number | null;
  requiredShallowBoxesOverride?: number | null;
  requiredBottomsOverride?: number | null;
  requiredCoversOverride?: number | null;
  requiredFramesOverride?: number | null;
  requiredQueenExcludersOverride?: number | null;
  requiredFeedersOverride?: number | null;
  extraSugarKg?: number;
  requiredSugarKgOverride?: number | null;
  extraSyrupLiters?: number;
  requiredSyrupLitersOverride?: number | null;
  customEquipment?: any;
}

export declare class CustomEquipmentTypeDto {
  id: string;
  name: string;
  unit: string;
  category: string;
  perHiveRatio?: number | null;
  isActive: boolean;
  displayOrder: number;
}

export declare class CreateCustomEquipmentTypeDto {
  name: string;
  unit: string;
  category: string;
  perHiveRatio?: number | null;
  displayOrder?: number;
}

export declare class ConsumableItemDto {
  name: string;
  unit: string;
  inUse: number;
  extra: number;
  total: number;
  required: number;
  recommended: number;
  needed: number;
  perHive: number;
}

export declare class CustomEquipmentItemDto {
  id: string;
  name: string;
  unit: string;
  inUse: number;
  extra: number;
  total: number;
  required: number;
  recommended: number;
  needed: number;
  perHive: number;
  category: string;
}

export declare class EquipmentPlanDto {
  currentHives: number;
  targetHives: number;
  inUse: EquipmentCountsDto;
  extra: EquipmentCountsDto;
  total: EquipmentCountsDto;
  required: EquipmentCountsDto;
  recommended: EquipmentCountsDto;
  needed: EquipmentCountsDto;
  hasOverrides: boolean;
  consumables: {
    sugar?: ConsumableItemDto;
    syrup?: ConsumableItemDto;
  };
  customEquipment: CustomEquipmentItemDto[];
}

// Type exports
export type EquipmentCounts = z.infer<typeof equipmentCountsSchema>;
export type EquipmentSettings = z.infer<typeof equipmentSettingsSchema>;
export type Inventory = z.infer<typeof inventorySchema>;
export type CustomEquipmentType = z.infer<typeof customEquipmentTypeSchema>;
export type CreateCustomEquipmentType = z.infer<typeof createCustomEquipmentTypeSchema>;
export type ConsumableItem = z.infer<typeof consumableItemSchema>;
export type CustomEquipmentItem = z.infer<typeof customEquipmentItemSchema>;
export type UserEquipmentPlan = z.infer<typeof userEquipmentPlanSchema>;