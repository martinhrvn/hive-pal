import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import axios from 'axios';
import {
  CreateShareLink,
  ShareLinkResponse,
  SharedResourceResponse,
} from 'shared-schemas';

const SHARES_KEYS = {
  all: ['shares'] as const,
  shared: (token: string) => [...SHARES_KEYS.all, 'shared', token] as const,
};

// Create a share link (authenticated)
export const useCreateShareLink = () => {
  const queryClient = useQueryClient();

  return useMutation<ShareLinkResponse, Error, CreateShareLink>({
    mutationFn: async (data: CreateShareLink) => {
      const response = await apiClient.post<ShareLinkResponse>(
        '/api/shares',
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHARES_KEYS.all });
    },
  });
};

// Revoke a share link (authenticated)
export const useRevokeShareLink = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/shares/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHARES_KEYS.all });
    },
  });
};

// Get shared resource data (public, no auth)
export const useSharedResource = (token: string) => {
  return useQuery<SharedResourceResponse>({
    queryKey: SHARES_KEYS.shared(token),
    queryFn: async () => {
      // Use plain axios without auth interceptors
      const response = await axios.get<SharedResourceResponse>(
        `/api/shares/${token}`,
      );
      return response.data;
    },
    enabled: !!token,
    retry: false,
  });
};
