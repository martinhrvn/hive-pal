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
  // Consumables
  trackSugar: boolean;
  sugarPerHive: number;
  trackSyrup: boolean;
  syrupPerHive: number;
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
  // Built-in consumables
  extraSugarKg?: number;
  requiredSugarKgOverride?: number | null;
  extraSyrupLiters?: number;
  requiredSyrupLitersOverride?: number | null;
  // Custom equipment as JSON
  customEquipment?: Record<
    string,
    { required: number; extra: number; requiredOverride?: number | null }
  >;
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

export interface ConsumableItem {
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

export interface CustomEquipmentItem extends ConsumableItem {
  id: string;
  category: string;
}

export interface CustomEquipmentTypeDto {
  id: string;
  name: string;
  unit: string;
  category: string;
  perHiveRatio?: number | null;
  isActive: boolean;
  displayOrder: number;
}

export interface CreateCustomEquipmentTypeDto {
  name: string;
  unit: string;
  category: string;
  perHiveRatio?: number | null;
  displayOrder?: number;
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
  consumables: {
    sugar?: ConsumableItem;
    syrup?: ConsumableItem;
  };
  customEquipment: CustomEquipmentItem[];
}

// Query keys
const EQUIPMENT_KEYS = {
  all: ['equipment'] as const,
  settings: () => [...EQUIPMENT_KEYS.all, 'settings'] as const,
  inventory: () => [...EQUIPMENT_KEYS.all, 'inventory'] as const,
  plan: () => [...EQUIPMENT_KEYS.all, 'plan'] as const,
  customTypes: () => [...EQUIPMENT_KEYS.all, 'customTypes'] as const,
};

// Equipment settings hooks
export const useEquipmentSettings = () => {
  return useQuery<EquipmentSettingsDto>({
    queryKey: EQUIPMENT_KEYS.settings(),
    queryFn: async () => {
      const response = await apiClient.get<EquipmentSettingsDto>(
        '/api/users/equipment-settings',
      );
      return response.data;
    },
  });
};

export const useUpdateEquipmentSettings = () => {
  const queryClient = useQueryClient();

  return useMutation<EquipmentSettingsDto, Error, EquipmentSettingsDto>({
    mutationFn: async settings => {
      const response = await apiClient.put<EquipmentSettingsDto>(
        '/api/users/equipment-settings',
        settings,
      );
      return response.data;
    },
    onSuccess: data => {
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
      const response = await apiClient.get<InventoryDto>(
        '/api/users/inventory',
      );
      return response.data;
    },
  });
};

export const useUpdateInventory = () => {
  const queryClient = useQueryClient();

  return useMutation<InventoryDto, Error, InventoryDto>({
    mutationFn: async inventory => {
      const response = await apiClient.put<InventoryDto>(
        '/api/users/inventory',
        inventory,
      );
      return response.data;
    },
    onSuccess: data => {
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
      const response = await apiClient.get<EquipmentPlanDto>(
        '/api/users/equipment-plan',
      );
      return response.data;
    },
  });
};

// Custom equipment hooks
export const useCustomEquipmentTypes = () => {
  return useQuery<CustomEquipmentTypeDto[]>({
    queryKey: EQUIPMENT_KEYS.customTypes(),
    queryFn: async () => {
      const response = await apiClient.get<CustomEquipmentTypeDto[]>(
        '/api/users/custom-equipment-types',
      );
      return response.data;
    },
  });
};

export const useCreateCustomEquipmentType = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CustomEquipmentTypeDto,
    Error,
    CreateCustomEquipmentTypeDto
  >({
    mutationFn: async data => {
      const response = await apiClient.post<CustomEquipmentTypeDto>(
        '/api/users/custom-equipment-types',
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EQUIPMENT_KEYS.customTypes() });
      queryClient.invalidateQueries({ queryKey: EQUIPMENT_KEYS.plan() });
    },
  });
};

export const useUpdateCustomEquipmentType = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CustomEquipmentTypeDto,
    Error,
    { id: string; data: Partial<CreateCustomEquipmentTypeDto> }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<CustomEquipmentTypeDto>(
        `/api/users/custom-equipment-types/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EQUIPMENT_KEYS.customTypes() });
      queryClient.invalidateQueries({ queryKey: EQUIPMENT_KEYS.plan() });
    },
  });
};

export const useDeleteCustomEquipmentType = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async id => {
      const response = await apiClient.delete<{ success: boolean }>(
        `/api/users/custom-equipment-types/${id}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EQUIPMENT_KEYS.customTypes() });
      queryClient.invalidateQueries({ queryKey: EQUIPMENT_KEYS.plan() });
    },
  });
};

export const useToggleCustomEquipmentType = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CustomEquipmentTypeDto,
    Error,
    { id: string; isActive: boolean }
  >({
    mutationFn: async ({ id, isActive }) => {
      const response = await apiClient.put<CustomEquipmentTypeDto>(
        `/api/users/custom-equipment-types/${id}/toggle`,
        { isActive },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EQUIPMENT_KEYS.customTypes() });
      queryClient.invalidateQueries({ queryKey: EQUIPMENT_KEYS.plan() });
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
    customTypes: useCustomEquipmentTypes(),
    createCustomType: useCreateCustomEquipmentType(),
    updateCustomType: useUpdateCustomEquipmentType(),
    deleteCustomType: useDeleteCustomEquipmentType(),
    toggleCustomType: useToggleCustomEquipmentType(),
  };
};
