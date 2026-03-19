import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { logApiError } from '../errorLogger';

export interface ApiaryOption {
  id: string;
  name: string;
}

export interface JoinRequestInfo {
  id: string;
  apiaryName: string;
  requesterName: string;
  requesterEmail: string;
  status: string;
}

export const useLookupApiariesByOwnerEmail = (email: string, enabled: boolean) =>
  useQuery<ApiaryOption[]>({
    queryKey: ['join-request-lookup', email],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiaryOption[]>(
          `/api/apiary-join-requests/lookup?email=${encodeURIComponent(email)}`,
        );
        return res.data;
      } catch (error) {
        logApiError(error, 'lookupApiariesByOwnerEmail');
        throw error;
      }
    },
    enabled,
    retry: false,
  });

export const useCreateJoinRequest = () =>
  useMutation<void, Error, { apiaryId: string }>({
    mutationFn: async ({ apiaryId }) => {
      try {
        await apiClient.post('/api/apiary-join-requests', { apiaryId });
      } catch (error) {
        logApiError(error, 'createJoinRequest');
        throw error;
      }
    },
  });

export const useJoinRequestInfo = (token: string) =>
  useQuery<JoinRequestInfo>({
    queryKey: ['join-request-info', token],
    queryFn: async () => {
      try {
        const res = await apiClient.get<JoinRequestInfo>(
          `/api/apiary-join-requests/approve/${token}`,
        );
        return res.data;
      } catch (error) {
        logApiError(error, 'getJoinRequestInfo');
        throw error;
      }
    },
    enabled: !!token,
    retry: false,
  });

export const useApproveJoinRequest = () =>
  useMutation<void, Error, { token: string; role: string }>({
    mutationFn: async ({ token, role }) => {
      try {
        await apiClient.post(`/api/apiary-join-requests/approve/${token}`, { role });
      } catch (error) {
        logApiError(error, 'approveJoinRequest');
        throw error;
      }
    },
  });

export const useDenyJoinRequest = () =>
  useMutation<void, Error, { token: string }>({
    mutationFn: async ({ token }) => {
      try {
        await apiClient.post(`/api/apiary-join-requests/deny/${token}`, {});
      } catch (error) {
        logApiError(error, 'denyJoinRequest');
        throw error;
      }
    },
  });
