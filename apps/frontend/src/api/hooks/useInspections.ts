import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
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
  HiveDetailResponse,
} from 'shared-schemas';
import { useApiaryStore } from '@/hooks/use-apiary';
import type { InspectionFormData, BoxConfigurationActionData } from '@/pages/inspection/components/inspection-form/schema.ts';
import { useNavigate } from 'react-router-dom';
import { toInspectionDateISOString } from '@/utils/inspection-date';
import { useUpdateHiveBoxes } from './useHives';
import { usePendingBoxUpdatesStore } from '@/stores/pendingBoxUpdatesStore';

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
  const { addPendingUpdate, updateStatus, removePendingUpdate } = usePendingBoxUpdatesStore();
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

    /**
     * Performs the box update with optimistic pending state tracking.
     * Adds a pending update to the store before attempting the API call,
     * allowing tracking even if the user navigates away.
     */
    const performBoxUpdate = async (inspectionRes: CreateInspectionResponse | UpdateInspectionResponse) => {
      // Check if there are box changes to apply
      if (
        !boxConfigAction?.updatedBoxes ||
        boxConfigAction.updatedBoxes.length === 0 ||
        !data.hiveId
      ) {
        return; // No box changes, skip box update
      }

      try {
        // Transform the box payload: strip temp IDs and prepare for API
        const transformedBoxes = boxConfigAction.updatedBoxes.map(box => ({
          ...box,
          id: box.id?.startsWith('temp-') ? undefined : box.id,
        }));

        // Fetch current hive data to get updatedAt timestamp for staleness detection
        // CRITICAL #3: Fail the entire box update if hive fetch fails - don't use fallback timestamp
        let hiveLastModifiedAt: string;
        try {
          const hiveResponse = await apiClient.get<HiveDetailResponse>(
            `/api/hives/${data.hiveId}`,
          );
          hiveLastModifiedAt = hiveResponse.data.updatedAt;
        } catch {
          // If we can't fetch hive data, abort box update and show warning
          const errorMessage = 'Failed to fetch hive data for staleness detection. Box update skipped.';
          toast.warning(
            `Inspection saved, but box configuration could not be updated: ${errorMessage}`,
          );
          return; // Exit early, no pending update added
        }

        // Add pending update to store with 'in-progress' status BEFORE attempting box update
        // This ensures the pending state is tracked even if user navigates away
        addPendingUpdate({
          inspectionId: inspectionRes.id,
          hiveId: data.hiveId,
          boxPayload: transformedBoxes,
          hiveLastModifiedAt,
          status: 'in-progress',
        });

        // Attempt the box update
        try {
          await updateHiveBoxes({
            id: data.hiveId,
            boxes: transformedBoxes,
          });

          // On success, remove the pending update from store
          removePendingUpdate(inspectionRes.id);
        } catch (boxUpdateError) {
          // On failure, update the pending update status to 'failed' with error message
          // HIGH #6: Extract actual API error message from AxiosError
          let errorMessage = 'Failed to update box configuration. Please try again.';

          if (axios.isAxiosError(boxUpdateError) && boxUpdateError.response?.data?.message) {
            errorMessage = boxUpdateError.response.data.message;
          } else if (boxUpdateError instanceof Error) {
            errorMessage = boxUpdateError.message;
          }

          updateStatus(inspectionRes.id, 'failed', errorMessage);

          // Show warning toast about the failure (banner will handle retry UI)
          toast.warning(
            `Inspection saved, but box configuration could not be updated: ${errorMessage}`,
          );
        }
      } catch (unexpectedError) {
        // MEDIUM #15: Handle unexpected errors and clean up stuck pending state
        removePendingUpdate(inspectionRes.id);
        console.error('[performBoxUpdate] Unexpected error:', unexpectedError);
        toast.error('An unexpected error occurred during box update.');
      }
    };

    /**
     * Handles post-save logic (showing success toast, performing box update, navigation)
     * MEDIUM #11: Extract common logic to avoid duplication between create/update branches
     */
    const handlePostSave = async (res: CreateInspectionResponse | UpdateInspectionResponse) => {
      // HIGH #5: Show appropriate success message based on whether box changes exist
      // If there are box changes, show a simpler message since box update toast will follow
      if (boxConfigAction?.updatedBoxes && boxConfigAction.updatedBoxes.length > 0) {
        toast.success('Inspection saved');
      } else {
        toast.success('Inspection saved successfully');
      }

      // Perform box update in background (don't await, don't block navigation)
      // CRITICAL #4: Add error logging for unhandled promise rejections
      performBoxUpdate(res).catch((error) => {
        console.error('[performBoxUpdate] Unhandled error in box update flow:', error);
      });

      await options?.onBeforeNavigate?.(res.id);
      navigate(getUrl(res.id));
    };

    // Create or update the inspection, then perform box update in background
    if (!inspectionId) {
      const res = await createInspectionMutation(formattedData);
      await handlePostSave(res);
    } else {
      const res = await updateInspectionMutation({
        id: inspectionId,
        data: {
          ...formattedData,
          id: inspectionId,
        },
      });
      await handlePostSave(res);
    }
  };
};
