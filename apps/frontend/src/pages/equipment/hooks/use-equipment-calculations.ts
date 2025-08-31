import { useMemo } from 'react';
import { EquipmentCounts, InventoryDto } from '@/api/hooks/useEquipment';

export const useEquipmentCalculations = (
  planData: any,
  inventoryData: InventoryDto | null,
  localInventory: InventoryDto | null,
) => {
  return useMemo(() => {
    if (!planData || !inventoryData) return null;

    const inventory = localInventory || inventoryData;

    // Apply overrides to required values
    const required: EquipmentCounts = {
      deepBoxes:
        inventory.requiredDeepBoxesOverride ?? planData.recommended.deepBoxes,
      shallowBoxes:
        inventory.requiredShallowBoxesOverride ?? planData.recommended.shallowBoxes,
      bottoms: inventory.requiredBottomsOverride ?? planData.recommended.bottoms,
      covers: inventory.requiredCoversOverride ?? planData.recommended.covers,
      frames: inventory.requiredFramesOverride ?? planData.recommended.frames,
      queenExcluders:
        inventory.requiredQueenExcludersOverride ??
        planData.recommended.queenExcluders,
      feeders: inventory.requiredFeedersOverride ?? planData.recommended.feeders,
    };

    // Recalculate extra values
    const extra: EquipmentCounts = {
      deepBoxes: inventory.extraDeepBoxes,
      shallowBoxes: inventory.extraShallowBoxes,
      bottoms: inventory.extraBottoms,
      covers: inventory.extraCovers,
      frames: inventory.extraFrames,
      queenExcluders: inventory.extraQueenExcluders,
      feeders: inventory.extraFeeders,
    };

    // Recalculate total
    const total: EquipmentCounts = {
      deepBoxes: planData.inUse.deepBoxes + extra.deepBoxes,
      shallowBoxes: planData.inUse.shallowBoxes + extra.shallowBoxes,
      bottoms: planData.inUse.bottoms + extra.bottoms,
      covers: planData.inUse.covers + extra.covers,
      frames: planData.inUse.frames + extra.frames,
      queenExcluders: planData.inUse.queenExcluders + extra.queenExcluders,
      feeders: planData.inUse.feeders + extra.feeders,
    };

    // Recalculate needed based on new required values
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
      ...planData,
      required,
      extra,
      total,
      needed,
    };
  }, [planData, inventoryData, localInventory]);
};