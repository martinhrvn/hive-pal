import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { logApiError } from '../errorLogger';
import {
  CreateHive,
  CreateHiveResponse,
  HiveDetailResponse,
  HiveFilter,
  HiveResponse,
  HiveWithBoxesResponse,
  UpdateHive,
  UpdateHiveResponse,
  UpdateHiveBoxes,
} from 'shared-schemas';
import { useApiaryStore } from '@/hooks/use-apiary';
import type { UseQueryOptions } from '@tanstack/react-query';

// Query keys
const HIVES_KEYS = {
  all: ['hives'] as const,
  lists: () => [...HIVES_KEYS.all, 'list'] as const,
  // The active apiary is part of the key: the hives list is apiary-scoped (via
  // the x-apiary-id header) and the query cache is persisted to localStorage, so
  // omitting it would let one apiary's result (e.g. an empty list) be served for
  // another apiary.
  list: (apiaryId: string | null, filters: HiveFilter | undefined) =>
    [...HIVES_KEYS.lists(), apiaryId, filters] as const,
  listsWithBoxes: () => [...HIVES_KEYS.all, 'listWithBoxes'] as const,
  listWithBoxes: (apiaryId: string | null, filters: HiveFilter | undefined) =>
    [...HIVES_KEYS.listsWithBoxes(), apiaryId, filters] as const,
  details: () => [...HIVES_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...HIVES_KEYS.details(), id] as const,
};

/**
 * Returns a function that resolves a hive's apiary id from the React Query
 * cache (hive lists + hive details), without triggering a fetch. Used to pin
 * inspection writes to the hive's own apiary in view-all mode. Returns
 * undefined when the hive isn't cached — callers then fall back to the active
 * apiary (correct in single-apiary mode).
 */
export const useHiveApiaryLookup = () => {
  const queryClient = useQueryClient();
  return (hiveId?: string): string | undefined => {
    if (!hiveId) return undefined;
    const lists = queryClient.getQueriesData<HiveResponse[]>({
      queryKey: HIVES_KEYS.lists(),
    });
    for (const [, data] of lists) {
      const hive = data?.find(h => h.id === hiveId);
      if (hive?.apiaryId) return hive.apiaryId;
    }
    const detail = queryClient.getQueryData<HiveDetailResponse>(
      HIVES_KEYS.detail(hiveId),
    );
    return detail?.apiaryId;
  };
};

// Get all hives with optional filtering
export const useHives = (
  filters?: HiveFilter,
  queryOptions?: Omit<UseQueryOptions<HiveResponse[]>, 'queryKey' | 'queryFn'>,
) => {
  const activeApiaryId = useApiaryStore(state => state.activeApiaryId);
  const viewAllApiaries = useApiaryStore(state => state.viewAllApiaries);
  // Scope of this query, used for cache-keying and enablement:
  //  - an explicit filters.apiaryId wins (a component asked for one apiary),
  //  - otherwise 'all' in view-all mode, or the selected apiary in single mode.
  // Keeping 'all' distinct from a concrete id prevents an all-apiaries result
  // being served for a single apiary (or vice versa) from the persisted cache.
  const scope = filters?.apiaryId ?? (viewAllApiaries ? 'all' : activeApiaryId);
  return useQuery<HiveResponse[]>({
    ...queryOptions,
    queryKey: HIVES_KEYS.list(scope, filters),
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filters?.apiaryId) params.append('apiaryId', filters.apiaryId);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.includeInactive !== undefined)
          params.append('includeInactive', filters.includeInactive.toString());

        const url = `/api/hives${params.toString() ? `?${params.toString()}` : ''}`;
        // An explicit apiary filter forces that apiary regardless of view-all.
        const config = filters?.apiaryId
          ? { headers: { 'x-apiary-id': filters.apiaryId } }
          : undefined;
        const response = await apiClient.get<HiveResponse[]>(url, config);
        return response.data;
      } catch (error) {
        logApiError(error, '/api/hives', 'GET');
        throw error;
      }
    },
    enabled: !!scope && queryOptions?.enabled !== false,
    ...queryOptions,
  });
};

export const useHiveOptions = (filters?: HiveFilter) => {
  const { data, ...queryOptions } = useHives(filters);
  return {
    ...queryOptions,
    data: data?.map(hive => ({ value: hive.id, label: hive.name })),
  };
};

// Get all hives with boxes for apiary layout
export const useHivesWithBoxes = (
  filters?: HiveFilter,
  queryOptions?: Omit<
    UseQueryOptions<HiveWithBoxesResponse[]>,
    'queryKey' | 'queryFn'
  >,
) => {
  const activeApiaryId = useApiaryStore(state => state.activeApiaryId);
  const viewAllApiaries = useApiaryStore(state => state.viewAllApiaries);
  const scope = filters?.apiaryId ?? (viewAllApiaries ? 'all' : activeApiaryId);
  return useQuery<HiveWithBoxesResponse[]>({
    ...queryOptions,
    queryKey: HIVES_KEYS.listWithBoxes(scope, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.apiaryId) params.append('apiaryId', filters.apiaryId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.includeInactive !== undefined)
        params.append('includeInactive', filters.includeInactive.toString());
      params.append('includeBoxes', 'true');

      const url = `/api/hives${params.toString() ? `?${params.toString()}` : ''}`;
      // An explicit apiary filter forces that apiary regardless of view-all.
      const config = filters?.apiaryId
        ? { headers: { 'x-apiary-id': filters.apiaryId } }
        : undefined;
      const response = await apiClient.get<HiveWithBoxesResponse[]>(
        url,
        config,
      );
      return response.data;
    },
    enabled: !!scope && queryOptions?.enabled !== false,
    ...queryOptions,
  });
};

// Get a single hive by ID
export const useHive = (id: string, options = {}) => {
  return useQuery<HiveDetailResponse>({
    queryKey: HIVES_KEYS.detail(id),
    queryFn: async () => {
      try {
        const response = await apiClient.get<HiveDetailResponse>(
          `/api/hives/${id}`,
        );
        return response.data;
      } catch (error) {
        logApiError(error, `/api/hives/${id}`, 'GET');
        throw error;
      }
    },
    enabled: !!id,
    ...options,
  });
};

// Create a new hive
export const useCreateHive = (callbacks?: { onSuccess: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHive) => {
      // Target the apiary the hive is being created in, so the backend checks
      // the user's role on that apiary (important in cross-apiary view-all mode,
      // where the selected apiary may differ from the chosen target).
      const response = await apiClient.post<CreateHiveResponse>(
        '/api/hives',
        data,
        apiaryHeaderConfig(data.apiaryId),
      );
      return response.data;
    },
    onSuccess: async () => {
      callbacks?.onSuccess?.();
      // Invalidate hive lists to refresh data
      await queryClient.invalidateQueries({
        queryKey: HIVES_KEYS.lists(),
      });
    },
    onError: error => {
      logApiError(error, '/api/hives', 'POST');
    },
  });
};

// Build an axios config that pins the request to a specific apiary. Used for
// cross-apiary writes in "view all" mode, where the mutation targets a hive
// that may not belong to the currently selected apiary. When apiaryId is
// undefined the interceptor falls back to the selected apiary.
export const apiaryHeaderConfig = (apiaryId?: string) =>
  apiaryId ? { headers: { 'x-apiary-id': apiaryId } } : undefined;

// Update an existing hive
export const useUpdateHive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      apiaryId,
    }: {
      id: string;
      data: UpdateHive;
      apiaryId?: string;
    }) => {
      const response = await apiClient.patch<UpdateHiveResponse>(
        `/api/hives/${id}`,
        data,
        apiaryHeaderConfig(apiaryId),
      );

      return response.data;
    },
    onSuccess: async (_data, variables) => {
      // Invalidate the specific hive and all lists
      await queryClient.invalidateQueries({
        queryKey: HIVES_KEYS.detail(variables.id),
      });

      await queryClient.invalidateQueries({
        queryKey: HIVES_KEYS.lists(),
      });
    },
    onError: (error, variables) => {
      logApiError(error, `/api/hives/${variables.id}`, 'PATCH');
    },
  });
};

// Delete a hive
export const useDeleteHive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, apiaryId }: { id: string; apiaryId?: string }) => {
      try {
        await apiClient.delete(
          `/api/hives/${id}`,
          apiaryHeaderConfig(apiaryId),
        );
      } catch (error) {
        logApiError(error, `/api/hives/${id}`, 'DELETE');
        throw error;
      }

      return id;
    },
    onSuccess: async () => {
      // Remove from cache and invalidate lists
      queryClient.invalidateQueries({ queryKey: HIVES_KEYS.lists() });
    },
  });
};

// Update hive boxes
export const useUpdateHiveBoxes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      boxes,
      apiaryId,
    }: {
      id: string;
      boxes: UpdateHiveBoxes['boxes'];
      apiaryId?: string;
    }) => {
      const response = await apiClient.put<UpdateHiveResponse>(
        `/api/hives/${id}/boxes`,
        { boxes },
        apiaryHeaderConfig(apiaryId),
      );
      return response.data;
    },
    onSuccess: async (_data, variables) => {
      // Invalidate the specific hive and hive lists so box-added markers refresh.
      await queryClient.invalidateQueries({
        queryKey: HIVES_KEYS.detail(variables.id),
      });
      await queryClient.invalidateQueries({
        queryKey: HIVES_KEYS.lists(),
      });
      await queryClient.invalidateQueries({
        queryKey: HIVES_KEYS.listsWithBoxes(),
      });
    },
    onError: (error, variables) => {
      logApiError(error, `/api/hives/${variables.id}/boxes`, 'PUT');
    },
  });
};
