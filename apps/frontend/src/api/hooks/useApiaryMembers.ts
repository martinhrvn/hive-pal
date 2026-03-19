import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { ApiaryMember, InviteMember, UpdateMemberRole } from 'shared-schemas';
import { logApiError } from '../errorLogger';

const MEMBERS_KEYS = {
  all: ['apiary-members'] as const,
  list: (apiaryId: string) =>
    [...MEMBERS_KEYS.all, 'list', apiaryId] as const,
};

export const useApiaryMembers = (apiaryId: string) =>
  useQuery<ApiaryMember[]>({
    queryKey: MEMBERS_KEYS.list(apiaryId),
    queryFn: async () => {
      try {
        const response = await apiClient.get<ApiaryMember[]>(
          `/api/apiaries/${apiaryId}/members`,
        );
        return response.data;
      } catch (error) {
        logApiError(error, `/api/apiaries/${apiaryId}/members`, 'GET');
        throw error;
      }
    },
    enabled: !!apiaryId,
  });

export const useInviteMember = (apiaryId: string) => {
  const queryClient = useQueryClient();
  return useMutation<ApiaryMember, Error, InviteMember>({
    mutationFn: async (data: InviteMember) => {
      const response = await apiClient.post<ApiaryMember>(
        `/api/apiaries/${apiaryId}/members`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEYS.list(apiaryId) });
    },
    onError: error => {
      logApiError(error, `/api/apiaries/${apiaryId}/members`, 'POST');
    },
  });
};

export const useUpdateMemberRole = (apiaryId: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiaryMember,
    Error,
    { userId: string; data: UpdateMemberRole }
  >({
    mutationFn: async ({ userId, data }) => {
      const response = await apiClient.patch<ApiaryMember>(
        `/api/apiaries/${apiaryId}/members/${userId}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEYS.list(apiaryId) });
    },
    onError: error => {
      logApiError(error, `/api/apiaries/${apiaryId}/members`, 'PATCH');
    },
  });
};

export const useRemoveMember = (apiaryId: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/api/apiaries/${apiaryId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEYS.list(apiaryId) });
    },
    onError: error => {
      logApiError(error, `/api/apiaries/${apiaryId}/members`, 'DELETE');
    },
  });
};

export const useAcceptInvite = () =>
  useMutation<{ apiaryId: string }, Error, string>({
    mutationFn: async (token: string) => {
      // The apiaryId segment is not validated on this endpoint; token is the key.
      const response = await apiClient.post<{ apiaryId: string }>(
        `/api/apiaries/invite/members/accept/${token}`,
      );
      return response.data;
    },
    onError: error => {
      logApiError(error, '/api/apiaries/invite/members/accept', 'POST');
    },
  });
