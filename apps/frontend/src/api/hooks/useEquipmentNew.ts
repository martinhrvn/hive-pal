import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import {
  EquipmentCategory,
  EquipmentItemWithCalculations,
  EquipmentMultiplier,
  EquipmentPlan,
  CreateEquipmentItem,
  UpdateEquipmentItem,
} from 'shared-schemas';

// Query keys
const EQUIPMENT_NEW_KEYS = {
  all: ['equipment-new'] as const,
  items: () => [...EQUIPMENT_NEW_KEYS.all, 'items'] as const,
  item: (itemId: string) => [...EQUIPMENT_NEW_KEYS.items(), itemId] as const,
  multiplier: () => [...EQUIPMENT_NEW_KEYS.all, 'multiplier'] as const,
  plan: () => [...EQUIPMENT_NEW_KEYS.all, 'plan'] as const,
};

// Equipment items hooks
export const useEquipmentItems = () => {
  return useQuery<EquipmentItemWithCalculations[]>({
    queryKey: EQUIPMENT_NEW_KEYS.items(),
    queryFn: async () => {
      const response = await apiClient.get<EquipmentItemWithCalculations[]>(
        '/api/users/equipment/items',
      );
      return response.data;
    },
  });
};

export const useEquipmentItem = (itemId: string) => {
  return useQuery<EquipmentItemWithCalculations>({
    queryKey: EQUIPMENT_NEW_KEYS.item(itemId),
    queryFn: async () => {
      const response = await apiClient.get<EquipmentItemWithCalculations>(
        `/api/users/equipment/items/${itemId}`,
      );
      return response.data;
    },
    enabled: !!itemId,
  });
};

export const useUpdateEquipmentItem = () => {
  const queryClient = useQueryClient();

  return useMutation<
    EquipmentItemWithCalculations,
    Error,
    { itemId: string; data: UpdateEquipmentItem }
  >({
    mutationFn: async ({ itemId, data }) => {
      const response = await apiClient.put<EquipmentItemWithCalculations>(
        `/api/users/equipment/items/${itemId}`,
        data,
      );
      return response.data;
    },
    onSuccess: updatedItem => {
      // Update the individual item cache
      queryClient.setQueryData(
        EQUIPMENT_NEW_KEYS.item(updatedItem.itemId),
        updatedItem,
      );

      // Update the items list cache
      queryClient.setQueryData(
        EQUIPMENT_NEW_KEYS.items(),
        (oldItems: EquipmentItemWithCalculations[] | undefined) => {
          if (!oldItems) return [updatedItem];
          return oldItems.map(item =>
            item.itemId === updatedItem.itemId ? updatedItem : item,
          );
        },
      );

      // Invalidate plan to recalculate
      queryClient.invalidateQueries({ queryKey: EQUIPMENT_NEW_KEYS.plan() });
    },
  });
};

export const useCreateEquipmentItem = () => {
  const queryClient = useQueryClient();

  return useMutation<EquipmentItemWithCalculations, Error, CreateEquipmentItem>(
    {
      mutationFn: async data => {
        const response = await apiClient.post<EquipmentItemWithCalculations>(
          '/api/users/equipment/items',
          data,
        );
        return response.data;
      },
      onSuccess: newItem => {
        // Add to items cache
        queryClient.setQueryData(
          EQUIPMENT_NEW_KEYS.items(),
          (oldItems: EquipmentItemWithCalculations[] | undefined) => {
            if (!oldItems) return [newItem];
            return [...oldItems, newItem].sort(
              (a, b) => a.displayOrder - b.displayOrder,
            );
          },
        );

        // Invalidate plan to recalculate
        queryClient.invalidateQueries({ queryKey: EQUIPMENT_NEW_KEYS.plan() });
      },
    },
  );
};

export const useDeleteEquipmentItem = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async itemId => {
      await apiClient.delete(`/api/users/equipment/items/${itemId}`);
    },
    onSuccess: (_, itemId) => {
      // Remove from items cache
      queryClient.setQueryData(
        EQUIPMENT_NEW_KEYS.items(),
        (oldItems: EquipmentItemWithCalculations[] | undefined) => {
          if (!oldItems) return [];
          return oldItems.filter(item => item.itemId !== itemId);
        },
      );

      // Remove individual item cache
      queryClient.removeQueries({ queryKey: EQUIPMENT_NEW_KEYS.item(itemId) });

      // Invalidate plan to recalculate
      queryClient.invalidateQueries({ queryKey: EQUIPMENT_NEW_KEYS.plan() });
    },
  });
};

// Equipment multiplier hooks
export const useEquipmentMultiplier = () => {
  return useQuery<EquipmentMultiplier>({
    queryKey: EQUIPMENT_NEW_KEYS.multiplier(),
    queryFn: async () => {
      const response = await apiClient.get<EquipmentMultiplier>(
        '/api/users/equipment/multiplier',
      );
      return response.data;
    },
  });
};

export const useUpdateEquipmentMultiplier = () => {
  const queryClient = useQueryClient();

  return useMutation<EquipmentMultiplier, Error, EquipmentMultiplier>({
    mutationFn: async data => {
      const response = await apiClient.put<EquipmentMultiplier>(
        '/api/users/equipment/multiplier',
        data,
      );
      return response.data;
    },
    onSuccess: updatedMultiplier => {
      queryClient.setQueryData(
        EQUIPMENT_NEW_KEYS.multiplier(),
        updatedMultiplier,
      );
      queryClient.invalidateQueries({ queryKey: EQUIPMENT_NEW_KEYS.plan() });
    },
  });
};

// Equipment plan hook
export const useEquipmentPlan = () => {
  return useQuery<EquipmentPlan>({
    queryKey: EQUIPMENT_NEW_KEYS.plan(),
    queryFn: async () => {
      const response = await apiClient.get<EquipmentPlan>(
        '/api/users/equipment/plan',
      );
      return response.data;
    },
  });
};

// Utility hooks for specific categories
export const useEquipmentItemsByCategory = (category?: EquipmentCategory) => {
  const { data: items, ...rest } = useEquipmentItems();

  const filteredItems = category
    ? items?.filter(item => item.category === category)
    : items;

  return {
    ...rest,
    data: filteredItems,
  };
};

export const useStandardEquipmentItems = () => {
  const { data: items, ...rest } = useEquipmentItems();

  const standardItems = items?.filter(item => !item.isCustom);

  return {
    ...rest,
    data: standardItems,
  };
};

export const useCustomEquipmentItems = () => {
  const { data: items, ...rest } = useEquipmentItems();

  const customItems = items?.filter(item => item.isCustom);

  return {
    ...rest,
    data: customItems,
  };
};

// Combined hook for convenience
export const useEquipmentNew = () => {
  return {
    items: useEquipmentItems(),
    item: useEquipmentItem,
    updateItem: useUpdateEquipmentItem(),
    createItem: useCreateEquipmentItem(),
    deleteItem: useDeleteEquipmentItem(),
    multiplier: useEquipmentMultiplier(),
    updateMultiplier: useUpdateEquipmentMultiplier(),
    plan: useEquipmentPlan(),
    itemsByCategory: useEquipmentItemsByCategory,
    standardItems: useStandardEquipmentItems(),
    customItems: useCustomEquipmentItems(),
  };
};
