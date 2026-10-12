import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import {
  CreateUserFeedType,
  UpdateUserFeedType,
  UserFeedTypeResponse,
} from 'shared-schemas';

const FEED_TYPE_KEYS = {
  all: ['feed-types'] as const,
};

/** The user's custom feed types (complementing the built-in registry). */
export const useFeedTypes = () => {
  return useQuery<UserFeedTypeResponse[]>({
    queryKey: FEED_TYPE_KEYS.all,
    queryFn: async () => {
      const response = await apiClient.get<UserFeedTypeResponse[]>(
        '/api/users/feed-types',
      );
      return response.data;
    },
  });
};

export const useCreateFeedType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateUserFeedType) => {
      const response = await apiClient.post<UserFeedTypeResponse>(
        '/api/users/feed-types',
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FEED_TYPE_KEYS.all });
    },
  });
};

export const useUpdateFeedType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateUserFeedType;
    }) => {
      const response = await apiClient.put<UserFeedTypeResponse>(
        `/api/users/feed-types/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FEED_TYPE_KEYS.all });
    },
  });
};

export const useDeleteFeedType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/users/feed-types/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FEED_TYPE_KEYS.all });
    },
  });
};
