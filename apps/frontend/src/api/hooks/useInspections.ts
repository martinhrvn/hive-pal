import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, getApiUrl } from '../client';
import {
  ActionType,
  CreateAction,
  CreateInspection,
  CreateInspectionResponse,
  InspectionFilter,
  InspectionResponse,
  InspectionStatus,
  UpdateInspection,
  UpdateInspectionResponse,
} from 'shared-schemas';
import { useAuth } from '@/context/auth-context';
import { InspectionFormData } from '@/pages/inspection/components/inspection-form/schema.ts';
import { useNavigate } from 'react-router-dom';

// Query keys
const INSPECTIONS_KEYS = {
  all: ['inspections'] as const,
  lists: () => [...INSPECTIONS_KEYS.all, 'list'] as const,
  list: (filters: InspectionFilter | undefined) =>
    [...INSPECTIONS_KEYS.lists(), filters] as const,
  details: () => [...INSPECTIONS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INSPECTIONS_KEYS.details(), id] as const,
};

// Get all inspections with optional filtering
export const useInspections = (filters?: InspectionFilter) => {
  return useQuery<InspectionResponse[]>({
    queryKey: INSPECTIONS_KEYS.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.hiveId) params.append('hiveId', filters.hiveId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);

      const url = `/api/inspections${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<InspectionResponse[]>(url);
      return response.data;
    },
  });
};

// Get overdue inspections
export const useOverdueInspections = () => {
  return useQuery<InspectionResponse[]>({
    queryKey: ['inspections', 'overdue'],
    queryFn: async () => {
      const response = await apiClient.get<InspectionResponse[]>(
        '/api/inspections/status/overdue',
      );
      return response.data;
    },
  });
};

// Get inspections due today
export const useDueTodayInspections = () => {
  return useQuery<InspectionResponse[]>({
    queryKey: ['inspections', 'due-today'],
    queryFn: async () => {
      const response = await apiClient.get<InspectionResponse[]>(
        '/api/inspections/status/due-today',
      );
      return response.data;
    },
  });
};

// Get a single inspection by ID
export const useInspection = (id: string, options = {}) => {
  return useQuery<InspectionResponse>({
    queryKey: INSPECTIONS_KEYS.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<InspectionResponse>(
        `/api/inspections/${id}`,
      );
      return response.data;
    },
    enabled: !!id,
    ...options,
  });
};

// Create a new inspection
export const useCreateInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInspection) => {
      const response = await apiClient.post<CreateInspectionResponse>(
        `/api/inspections`,
        data,
      );

      return response.data;
    },
    onSuccess: async () => {
      // Invalidate inspection lists to refresh data
      await queryClient.invalidateQueries({
        queryKey: INSPECTIONS_KEYS.lists(),
      });
    },
  });
};

// Update an existing inspection
export const useUpdateInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateInspection;
    }) => {
      const response = await apiClient.patch<UpdateInspectionResponse>(
        `/api/inspections/${id}`,
        data,
      );

      return response.data;
    },
    onSuccess: async (_data, variables) => {
      // Invalidate the specific inspection and all lists
      await queryClient.invalidateQueries({
        queryKey: INSPECTIONS_KEYS.detail(variables.id),
      });
      await queryClient.invalidateQueries({
        queryKey: INSPECTIONS_KEYS.lists(),
      });
    },
  });
};

// Delete an inspection
export const useDeleteInspection = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(getApiUrl(`/api/inspections/${id}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete inspection with id ${id}`);
      }

      return id;
    },
    onSuccess: async () => {
      // Remove from cache and invalidate lists
      queryClient.invalidateQueries({ queryKey: INSPECTIONS_KEYS.lists() });
    },
  });
};

export const useUpsertInspection = (inspectionId?: string) => {
  const { mutate: createInspectionMutation } = useCreateInspection();
  const { mutate: updateInspectionMutation } = useUpdateInspection();
  const getUrl = (inspectionId?: string) => `/inspections/${inspectionId}`;
  const navigate = useNavigate();
  return (data: InspectionFormData, status?: InspectionStatus) => {
    // Transform actions to match API format
    const transformedActions = data.actions
      ?.map((action): CreateAction | null => {
        switch (action.type) {
          case 'FEEDING':
            return {
              type: action.type,
              notes: action.notes,
              details: {
                type: action.type,
                feedType: action.feedType,
                amount: action.quantity,
                unit: action.unit,
                concentration: action.concentration,
              },
            };
          case 'TREATMENT':
            return {
              type: action.type,
              notes: action.notes,
              details: {
                type: action.type,
                product: action.treatmentType,
                quantity: action.amount,
                unit: action.unit,
              },
            };
          case 'FRAME':
            return {
              type: ActionType.FRAME,
              notes: action.notes,
              details: {
                type: ActionType.FRAME,
                quantity: action.frames,
              },
            };
          default:
            return null;
        }
      })
      .filter((a): a is CreateAction => Boolean(a));

    const formattedData = {
      ...data,
      date: data.date.toISOString(),
      status: status || data.status,
      actions: transformedActions,
    };

    if (!inspectionId) {
      createInspectionMutation(formattedData, {
        onSuccess: res => navigate(getUrl(res.id)),
      });
    } else {
      updateInspectionMutation(
        {
          id: inspectionId,
          data: {
            ...formattedData,
            id: inspectionId,
          },
        },
        {
          onSuccess: res => navigate(getUrl(res.id)),
        },
      );
    }
  };
};
