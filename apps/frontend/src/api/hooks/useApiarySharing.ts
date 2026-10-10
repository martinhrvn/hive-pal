import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import {
  CreateApiaryInvite,
  UpdateApiaryMember,
  ApiaryInviteResponse,
  ApiaryMemberResponse,
  InviteInfoResponse,
  JoinApiaryResponse,
} from 'shared-schemas';
import { logApiError } from '../errorLogger';
import axios from 'axios';

// Query keys
const SHARING_KEYS = {
  invites: (apiaryId: string) => ['apiary-invites', apiaryId] as const,
  members: (apiaryId: string) => ['apiary-members', apiaryId] as const,
  inviteInfo: (token: string) => ['invite-info', token] as const,
};

// Get invite info (public — no auth required)
export const useInviteInfo = (token: string) => {
  return useQuery<InviteInfoResponse>({
    queryKey: SHARING_KEYS.inviteInfo(token),
    queryFn: async () => {
      try {
        const response = await axios.get<InviteInfoResponse>(
          `/api/join/${token}`,
        );
        return response.data;
      } catch (error) {
        logApiError(error, `/api/join/${token}`, 'GET');
        throw error;
      }
    },
    enabled: !!token,
  });
};

// Join an apiary via invite token
export const useJoinApiary = () => {
  const queryClient = useQueryClient();

  return useMutation<JoinApiaryResponse, Error, string>({
    mutationFn: async (token: string) => {
      const response = await apiClient.post<JoinApiaryResponse>(
        `/api/join/${token}`,
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['apiaries'] });
    },
    onError: error => {
      logApiError(error, '/api/join', 'POST');
    },
  });
};

// List invite links for an apiary (owner only)
export const useApiaryInvites = (apiaryId: string) => {
  return useQuery<ApiaryInviteResponse[]>({
    queryKey: SHARING_KEYS.invites(apiaryId),
    queryFn: async () => {
      const response = await apiClient.get<ApiaryInviteResponse[]>(
        `/api/apiaries/${apiaryId}/invites`,
      );
      return response.data;
    },
    enabled: !!apiaryId,
  });
};

// Create an invite link
export const useCreateApiaryInvite = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiaryInviteResponse,
    Error,
    { apiaryId: string; data: CreateApiaryInvite }
  >({
    mutationFn: async ({ apiaryId, data }) => {
      const response = await apiClient.post<ApiaryInviteResponse>(
        `/api/apiaries/${apiaryId}/invites`,
        data,
      );
      return response.data;
    },
    onSuccess: async (_data, { apiaryId }) => {
      await queryClient.invalidateQueries({
        queryKey: SHARING_KEYS.invites(apiaryId),
      });
    },
    onError: error => {
      logApiError(error, '/api/apiaries/invites', 'POST');
    },
  });
};

// Revoke an invite link
export const useRevokeApiaryInvite = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { apiaryId: string; inviteId: string }>({
    mutationFn: async ({ apiaryId, inviteId }) => {
      await apiClient.delete(`/api/apiaries/${apiaryId}/invites/${inviteId}`);
    },
    onSuccess: async (_data, { apiaryId }) => {
      await queryClient.invalidateQueries({
        queryKey: SHARING_KEYS.invites(apiaryId),
      });
    },
  });
};

// List members of an apiary (owner only)
export const useApiaryMembers = (apiaryId: string) => {
  return useQuery<ApiaryMemberResponse[]>({
    queryKey: SHARING_KEYS.members(apiaryId),
    queryFn: async () => {
      const response = await apiClient.get<ApiaryMemberResponse[]>(
        `/api/apiaries/${apiaryId}/members`,
      );
      return response.data;
    },
    enabled: !!apiaryId,
  });
};

// Update a member (approve/reject/change role)
export const useUpdateApiaryMember = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiaryMemberResponse,
    Error,
    { apiaryId: string; memberId: string; data: UpdateApiaryMember }
  >({
    mutationFn: async ({ apiaryId, memberId, data }) => {
      const response = await apiClient.patch<ApiaryMemberResponse>(
        `/api/apiaries/${apiaryId}/members/${memberId}`,
        data,
      );
      return response.data;
    },
    onSuccess: async (_data, { apiaryId }) => {
      await queryClient.invalidateQueries({
        queryKey: SHARING_KEYS.members(apiaryId),
      });
    },
  });
};

// Remove a member
export const useRemoveApiaryMember = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { apiaryId: string; memberId: string }>({
    mutationFn: async ({ apiaryId, memberId }) => {
      await apiClient.delete(`/api/apiaries/${apiaryId}/members/${memberId}`);
    },
    onSuccess: async (_data, { apiaryId }) => {
      await queryClient.invalidateQueries({
        queryKey: SHARING_KEYS.members(apiaryId),
      });
    },
  });
};

// Leave a shared apiary
export const useLeaveApiary = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (apiaryId: string) => {
      await apiClient.delete(`/api/apiaries/${apiaryId}/members/me`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['apiaries'] });
    },
  });
};
