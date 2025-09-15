import { z } from 'zod';
import { HarvestStatus } from './status';

// Harvest Hive schema
export const harvestHiveSchema = z.object({
  hiveId: z.string().uuid(),
  framesTaken: z.number().int().min(1),
  honeyAmount: z.number().min(0).optional(),
  honeyAmountUnit: z.string().default('kg').optional(),
  honeyPercentage: z.number().min(0).max(100).optional(),
});

// Create Harvest schema
export const createHarvestSchema = z.object({
  date: z.string().datetime(),
  notes: z.string().optional(),
  harvestHives: z.array(harvestHiveSchema).min(1),
});

// Update Harvest schema
export const updateHarvestSchema = z.object({
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
  totalWeight: z.number().min(0).optional(),
  totalWeightUnit: z.string().default('kg').optional(),
  harvestHives: z.array(harvestHiveSchema).optional(),
});

// Set Harvest Weight schema
export const setHarvestWeightSchema = z.object({
  totalWeight: z.number().min(0),
  totalWeightUnit: z.string().default('kg').optional(),
});

// Harvest Response schema
export const harvestResponseSchema = z.object({
  id: z.string().uuid(),
  apiaryId: z.string().uuid(),
  date: z.string(),
  status: z.nativeEnum(HarvestStatus),
  totalWeight: z.number().optional(),
  totalWeightUnit: z.string().optional(),
  notes: z.string().optional(),
  harvestHives: z.array(
    z.object({
      id: z.string().uuid(),
      hiveId: z.string().uuid(),
      hiveName: z.string(),
      framesTaken: z.number(),
      honeyAmount: z.number().optional(),
      honeyAmountUnit: z.string().optional(),
      honeyPercentage: z.number().optional(),
    })
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Harvest List Response schema
export const harvestListResponseSchema = z.object({
  id: z.string().uuid(),
  apiaryId: z.string().uuid(),
  date: z.string(),
  status: z.nativeEnum(HarvestStatus),
  totalWeight: z.number().optional(),
  totalWeightUnit: z.string().optional(),
  hiveCount: z.number(),
  totalFrames: z.number(),
  createdAt: z.string(),
});

// Harvest Filter schema
export const harvestFilterSchema = z.object({
  apiaryId: z.string().uuid().optional(),
  status: z.nativeEnum(HarvestStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Export types
export type HarvestHive = z.infer<typeof harvestHiveSchema>;
export type CreateHarvest = z.infer<typeof createHarvestSchema>;
export type UpdateHarvest = z.infer<typeof updateHarvestSchema>;
export type SetHarvestWeight = z.infer<typeof setHarvestWeightSchema>;
export type HarvestResponse = z.infer<typeof harvestResponseSchema>;
export type HarvestListResponse = z.infer<typeof harvestListResponseSchema>;
export type HarvestFilter = z.infer<typeof harvestFilterSchema>;