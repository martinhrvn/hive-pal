import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

// Equipment types based on backend DTOs
export interface EquipmentSettingsDto {
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
}

export interface InventoryDto {
  extraDeepBoxes: number;
  extraShallowBoxes: number;
  extraBottoms: number;
  extraCovers: number;
  extraFrames: number;
  extraQueenExcluders: number;
  extraFeeders: number;
  // Manual overrides for required equipment
  requiredDeepBoxesOverride?: number | null;
  requiredShallowBoxesOverride?: number | null;
  requiredBottomsOverride?: number | null;
  requiredCoversOverride?: number | null;
  requiredFramesOverride?: number | null;
  requiredQueenExcludersOverride?: number | null;
  requiredFeedersOverride?: number | null;
}

export interface EquipmentCounts {
  deepBoxes: number;
  shallowBoxes: number;
  bottoms: number;
  covers: number;
  frames: number;
  queenExcluders: number;
  feeders: number;
}

export interface EquipmentPlanDto {
  currentHives: number;
  targetHives: number;
  inUse: EquipmentCounts;
  extra: EquipmentCounts;
  total: EquipmentCounts;
  required: EquipmentCounts;
  recommended: EquipmentCounts;
  needed: EquipmentCounts;
  hasOverrides: boolean;
}

// Query keys
const EQUIPMENT_KEYS = {
  all: ['equipment'] as const,
  settings: () => [...EQUIPMENT_KEYS.all, 'settings'] as const,
  inventory: () => [...EQUIPMENT_KEYS.all, 'inventory'] as const,
  plan: () => [...EQUIPMENT_KEYS.all, 'plan'] as const,
};

// Equipment settings hooks
export const useEquipmentSettings = () => {
  return useQuery<EquipmentSettingsDto>({
    queryKey: EQUIPMENT_KEYS.settings(),
    queryFn: async () => {
      const response = await apiClient.get<EquipmentSettingsDto>('/api/users/equipment-settings');
      return response.data;
    },
  });
};

export const useUpdateEquipmentSettings = () => {
  const queryClient = useQueryClient();

  return useMutation<EquipmentSettingsDto, Error, EquipmentSettingsDto>({
    mutationFn: async (settings) => {
      const response = await apiClient.put<EquipmentSettingsDto>(
        '/api/users/equipment-settings',
        settings
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(EQUIPMENT_KEYS.settings(), data);
      queryClient.invalidateQueries({ queryKey: EQUIPMENT_KEYS.plan() });
    },
  });
};

// Inventory hooks
export const useInventory = () => {
  return useQuery<InventoryDto>({
    queryKey: EQUIPMENT_KEYS.inventory(),
    queryFn: async () => {
      const response = await apiClient.get<InventoryDto>('/api/users/inventory');
      return response.data;
    },
  });
};

export const useUpdateInventory = () => {
  const queryClient = useQueryClient();

  return useMutation<InventoryDto, Error, InventoryDto>({
    mutationFn: async (inventory) => {
      const response = await apiClient.put<InventoryDto>(
        '/api/users/inventory',
        inventory
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(EQUIPMENT_KEYS.inventory(), data);
      queryClient.invalidateQueries({ queryKey: EQUIPMENT_KEYS.plan() });
    },
  });
};

// Equipment plan hook
export const useEquipmentPlan = () => {
  return useQuery<EquipmentPlanDto>({
    queryKey: EQUIPMENT_KEYS.plan(),
    queryFn: async () => {
      const response = await apiClient.get<EquipmentPlanDto>('/api/users/equipment-plan');
      return response.data;
    },
  });
};

// Combined hook for convenience
export const useEquipment = () => {
  return {
    settings: useEquipmentSettings(),
    updateSettings: useUpdateEquipmentSettings(),
    inventory: useInventory(),
    updateInventory: useUpdateInventory(),
    plan: useEquipmentPlan(),
  };
};