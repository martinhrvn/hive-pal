import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { useApiaryScope } from '@/hooks/use-apiary-scope';
import {
  CalendarFilter,
  CalendarResponse,
  SubscriptionUrlResponse,
} from 'shared-schemas';

export type { CalendarEvent, SubscriptionUrlResponse } from 'shared-schemas';

// Query keys
const CALENDAR_KEYS = {
  all: ['calendar'] as const,
  lists: () => [...CALENDAR_KEYS.all, 'list'] as const,
  // The apiary scope ('all' or a concrete id) is part of the key: see useApiaryScope.
  list: (scope: string | null, filters: CalendarFilter | undefined) =>
    [...CALENDAR_KEYS.lists(), scope, filters] as const,
  subscription: (apiaryId: string) =>
    [...CALENDAR_KEYS.all, 'subscription', apiaryId] as const,
};

// Get calendar events with optional filtering
export const useCalendar = (filters?: CalendarFilter) => {
  const scope = useApiaryScope();
  return useQuery<CalendarResponse>({
    queryKey: CALENDAR_KEYS.list(scope, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.hiveId) params.append('hiveId', filters.hiveId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const url = `/api/calendar${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<CalendarResponse>(url);
      return response.data;
    },
    enabled: !!scope,
  });
};

// Get calendar subscription URL for an apiary
export const useCalendarSubscription = (apiaryId: string) => {
  return useQuery<SubscriptionUrlResponse>({
    queryKey: CALENDAR_KEYS.subscription(apiaryId),
    queryFn: async () => {
      const response = await apiClient.get<SubscriptionUrlResponse>(
        `/api/calendar/apiary/${apiaryId}/subscription`,
      );
      return response.data;
    },
    enabled: !!apiaryId,
  });
};

// Toggle calendar inspections for all hives in an apiary
export const useToggleCalendarInspections = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { updated: number },
    Error,
    { apiaryId: string; enabled: boolean }
  >({
    mutationFn: async ({ apiaryId, enabled }) => {
      const response = await apiClient.patch<{ updated: number }>(
        `/api/calendar/apiary/${apiaryId}/calendar-inspections`,
        { enabled },
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hives'] });
    },
  });
};

// Regenerate calendar subscription URL
export const useRegenerateCalendarSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation<SubscriptionUrlResponse, Error, string>({
    mutationFn: async (apiaryId: string) => {
      const response = await apiClient.post<SubscriptionUrlResponse>(
        `/api/calendar/apiary/${apiaryId}/subscription/regenerate`,
      );
      return response.data;
    },
    onSuccess: (data, apiaryId) => {
      queryClient.setQueryData(CALENDAR_KEYS.subscription(apiaryId), data);
    },
  });
};
