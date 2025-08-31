import { z } from 'zod';
import { EquipmentCategory } from './types';

// Base equipment item schema
export const equipmentItemSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().min(1),
  name: z.string().nullable(),
  enabled: z.boolean(),
  perHive: z.number().min(0),
  extra: z.number().min(0),
  neededOverride: z.number().min(0).nullable(),
  category: z.nativeEnum(EquipmentCategory),
  unit: z.string().min(1),
  isCustom: z.boolean(),
  displayOrder: z.number().min(0),
});

// Equipment item with calculated fields (used in plan responses)
export const equipmentItemWithCalculationsSchema = equipmentItemSchema.extend({
  inUse: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  needed: z.number().min(0).optional(), // What you need for target hives (neededOverride or perHive * targetHives)
  recommended: z.number().min(0).optional(), // Always perHive * targetHives
  toPurchase: z.number().optional(), // Positive = need to buy, negative = surplus
});

// Equipment multiplier schema
export const equipmentMultiplierSchema = z.object({
  targetMultiplier: z.number().min(0.1).max(10),
});

// Equipment plan schema
export const equipmentPlanSchema = z.object({
  currentHives: z.number().min(0),
  targetHives: z.number().min(0),
  items: z.array(equipmentItemWithCalculationsSchema),
  hasOverrides: z.boolean(),
});

// Create equipment item schema (for POST requests)
export const createEquipmentItemSchema = z.object({
  itemId: z.string().min(1),
  name: z.string().min(1).optional(),
  enabled: z.boolean().optional().default(true),
  perHive: z.number().min(0).optional().default(0),
  extra: z.number().min(0).optional().default(0),
  neededOverride: z.number().min(0).nullable().optional(),
  category: z.nativeEnum(EquipmentCategory),
  unit: z.string().min(1).optional().default('pieces'),
  displayOrder: z.number().min(0).optional().default(999),
});

// Update equipment item schema (for PUT requests)
export const updateEquipmentItemSchema = z.object({
  name: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  perHive: z.number().min(0).optional(),
  extra: z.number().min(0).optional(),
  neededOverride: z.number().min(0).nullable().optional(),
  unit: z.string().min(1).optional(),
  displayOrder: z.number().min(0).optional(),
});

// Type exports
export type EquipmentItem = z.infer<typeof equipmentItemSchema>;
export type EquipmentItemWithCalculations = z.infer<typeof equipmentItemWithCalculationsSchema>;
export type EquipmentMultiplier = z.infer<typeof equipmentMultiplierSchema>;
export type EquipmentPlan = z.infer<typeof equipmentPlanSchema>;
export type CreateEquipmentItem = z.infer<typeof createEquipmentItemSchema>;
export type UpdateEquipmentItem = z.infer<typeof updateEquipmentItemSchema>;