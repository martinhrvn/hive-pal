import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { CalendarFilter, CalendarResponse } from 'shared-schemas';

export type { CalendarEvent } from 'shared-schemas';

// Query keys
const CALENDAR_KEYS = {
  all: ['calendar'] as const,
  lists: () => [...CALENDAR_KEYS.all, 'list'] as const,
  list: (filters: CalendarFilter | undefined) =>
    [...CALENDAR_KEYS.lists(), filters] as const,
};

// Get calendar events with optional filtering
export const useCalendar = (filters?: CalendarFilter) => {
  return useQuery<CalendarResponse>({
    queryKey: CALENDAR_KEYS.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.hiveId) params.append('hiveId', filters.hiveId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const url = `/api/calendar${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<CalendarResponse>(url);
      return response.data;
    },
  });
};
