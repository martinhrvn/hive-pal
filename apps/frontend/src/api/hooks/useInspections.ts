import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { apiClient } from '../client';
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
import { useApiaryStore } from '@/hooks/use-apiary';
import type { InspectionFormData, BoxConfigurationActionData } from '@/pages/inspection/components/inspection-form/schema.ts';
import { useNavigate } from 'react-router-dom';
import { toInspectionDateISOString } from '@/utils/inspection-date';
import { useUpdateHiveBoxes } from './useHives';

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
  const activeApiaryId = useApiaryStore(state => state.activeApiaryId);
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
    enabled: !!activeApiaryId,
  });
};

// Get overdue inspections
export const useOverdueInspections = () => {
  const activeApiaryId = useApiaryStore(state => state.activeApiaryId);
  return useQuery<InspectionResponse[]>({
    queryKey: ['inspections', 'overdue'],
    queryFn: async () => {
      const response = await apiClient.get<InspectionResponse[]>(
        '/api/inspections/status/overdue',
      );
      return response.data;
    },
    enabled: !!activeApiaryId,
  });
};

// Get inspections due today
export const useDueTodayInspections = () => {
  const activeApiaryId = useApiaryStore(state => state.activeApiaryId);
  return useQuery<InspectionResponse[]>({
    queryKey: ['inspections', 'due-today'],
    queryFn: async () => {
      const response = await apiClient.get<InspectionResponse[]>(
        '/api/inspections/status/due-today',
      );
      return response.data;
    },
    enabled: !!activeApiaryId,
  });
};

// Get upcoming inspections (future pending inspections)
export const useUpcomingInspections = (limit?: number) => {
  const activeApiaryId = useApiaryStore(state => state.activeApiaryId);
  return useQuery<InspectionResponse[]>({
    queryKey: ['inspections', 'upcoming', limit],
    queryFn: async () => {
      // Get tomorrow's date as start
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const params = new URLSearchParams();
      params.append('startDate', tomorrow.toISOString());
      params.append('status', 'PENDING');

      const response = await apiClient.get<InspectionResponse[]>(
        `/api/inspections?${params.toString()}`,
      );

      // Sort by date ascending and limit if specified
      const sorted = response.data.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      return limit ? sorted.slice(0, limit) : sorted;
    },
    enabled: !!activeApiaryId,
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
  const { t } = useTranslation('inspection');

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/inspections/${id}`);
      return id;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: INSPECTIONS_KEYS.lists() });
    },
    onError: () => {
      toast.error(t('detailSidebar.deleteFailed'));
    },
  });
};

export const useUpsertInspection = (
  inspectionId?: string,
  options?: { onBeforeNavigate?: (inspectionId: string) => Promise<void> },
) => {
  const { mutateAsync: createInspectionMutation } = useCreateInspection();
  const { mutateAsync: updateInspectionMutation } = useUpdateInspection();
  const { mutateAsync: updateHiveBoxes } = useUpdateHiveBoxes();
  const getUrl = (inspectionId?: string) => `/inspections/${inspectionId}`;
  const navigate = useNavigate();
  return async (data: InspectionFormData, status?: InspectionStatus) => {
    // Extract box configuration action so we can apply hive update on success
    const boxConfigAction = data.actions?.find(a => a.type === 'BOX_CONFIGURATION') as
      | BoxConfigurationActionData
      | undefined;

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
          case 'MAINTENANCE':
            return {
              type: ActionType.MAINTENANCE,
              notes: action.notes,
              details: {
                type: ActionType.MAINTENANCE,
                component: action.component,
                status: action.status,
              },
            };
          case 'BOX_CONFIGURATION':
            // Strip the local-only updatedBoxes field before sending to API
            // but include the per-box summary derived from updatedBoxes
            return {
              type: ActionType.BOX_CONFIGURATION,
              details: {
                type: ActionType.BOX_CONFIGURATION,
                boxesAdded: action.boxesAdded,
                boxesRemoved: action.boxesRemoved,
                framesAdded: action.framesAdded,
                framesRemoved: action.framesRemoved,
                totalBoxes: action.totalBoxes,
                totalFrames: action.totalFrames,
                boxes:
                  action.updatedBoxes?.map(b => ({
                    type: b.type,
                    frameCount: b.frameCount,
                  })) ?? action.boxesSummary,
              },
            };
          default:
            return null;
        }
      })
      .filter((a): a is CreateAction => Boolean(a));

    // Build score override if custom scores were set
    const scoreOverride = data.score
      ? {
          overallScore: data.score.overallScore ?? null,
          populationScore: data.score.populationScore ?? null,
          storesScore: data.score.storesScore ?? null,
          queenScore: data.score.queenScore ?? null,
        }
      : undefined;

    const formattedData = {
      ...data,
      date: toInspectionDateISOString(data.date, data.isAllDay ?? true),
      status: status || data.status,
      actions: transformedActions,
      score: scoreOverride,
    };

    const applyBoxUpdate = async () => {
      if (
        boxConfigAction?.updatedBoxes &&
        boxConfigAction.updatedBoxes.length > 0 &&
        data.hiveId
      ) {
        await updateHiveBoxes({
          id: data.hiveId,
          boxes: boxConfigAction.updatedBoxes.map(box => ({
            ...box,
            id: box.id?.startsWith('temp-') ? undefined : box.id,
          })),
        });
      }
    };

    const tryApplyBoxUpdate = async () => {
      try {
        await applyBoxUpdate();
      } catch {
        toast.error(
          'Inspection saved, but box configuration could not be updated. Please re-save box configuration.',
        );
      }
    };

    if (!inspectionId) {
      const res = await createInspectionMutation(formattedData);
      await tryApplyBoxUpdate();
      await options?.onBeforeNavigate?.(res.id);
      navigate(getUrl(res.id));
    } else {
      const res = await updateInspectionMutation({
        id: inspectionId,
        data: {
          ...formattedData,
          id: inspectionId,
        },
      });
      await tryApplyBoxUpdate();
      await options?.onBeforeNavigate?.(res.id);
      navigate(getUrl(res.id));
    }
  };
};
