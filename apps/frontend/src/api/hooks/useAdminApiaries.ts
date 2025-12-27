import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { ApiaryMapPoint } from 'shared-schemas';

// Query keys
const ADMIN_APIARIES_KEYS = {
  all: ['admin', 'apiaries'] as const,
  map: () => [...ADMIN_APIARIES_KEYS.all, 'map'] as const,
};

// Get all apiaries with coordinates for map display (admin only)
export const useAdminApiariesMap = () => {
  return useQuery<ApiaryMapPoint[]>({
    queryKey: ADMIN_APIARIES_KEYS.map(),
    queryFn: async () => {
      const response = await apiClient.get<ApiaryMapPoint[]>(
        '/api/apiaries/admin/map',
      );
      return response.data;
    },
    staleTime: 60000, // 1 minute
  });
};
