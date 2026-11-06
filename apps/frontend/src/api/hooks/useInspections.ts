import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { apiClient } from '../client';
import {
  ActionType,
  BoxTypeEnum,
  CreateAction,
  CreateInspection,
  CreateInspectionResponse,
  InspectionFilter,
  InspectionResponse,
  InspectionStatus,
  UpdateInspection,
  UpdateInspectionResponse,
  TreatmentActionDetails,
} from 'shared-schemas';
import { useApiaryStore } from '@/hooks/use-apiary';
import type {
  InspectionFormData,
  ActionData,
  TreatmentActionData,
} from '@/pages/inspection/components/inspection-form/schema.ts';
import { useNavigate } from 'react-router';
import { useUnitFormat } from '@/hooks/use-unit-format';
import { toInspectionDateISOString } from '@/utils/inspection-date';
import { apiaryHeaderConfig } from './useHives';
import { invalidateTreatmentTotals } from './useTreatmentProducts';

// Query keys
const INSPECTIONS_KEYS = {
  all: ['inspections'] as const,
  lists: () => [...INSPECTIONS_KEYS.all, 'list'] as const,
  // The apiary scope ('all' or a concrete id) is part of the key so a
  // cross-apiary result is never served for a single apiary (or vice versa).
  list: (scope: string | null, filters: InspectionFilter | undefined) =>
    [...INSPECTIONS_KEYS.lists(), scope, filters] as const,
  details: () => [...INSPECTIONS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INSPECTIONS_KEYS.details(), id] as const,
};

// Resolve the current apiary scope: 'all' in view-all mode, otherwise the
// selected apiary id (or null when nothing is selected yet).
const useApiaryScope = () => {
  const activeApiaryId = useApiaryStore(state => state.activeApiaryId);
  const viewAllApiaries = useApiaryStore(state => state.viewAllApiaries);
  return viewAllApiaries ? 'all' : activeApiaryId;
};

// Get all inspections with optional filtering
export const useInspections = (filters?: InspectionFilter) => {
  const scope = useApiaryScope();
  return useQuery<InspectionResponse[]>({
    queryKey: INSPECTIONS_KEYS.list(scope, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.hiveId) params.append('hiveId', filters.hiveId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);

      const query = params.toString();
      const url = query ? `/api/inspections?${query}` : '/api/inspections';
      const response = await apiClient.get<InspectionResponse[]>(url);
      return response.data;
    },
    enabled: !!scope,
  });
};

// Get overdue inspections
export const useOverdueInspections = () => {
  const scope = useApiaryScope();
  return useQuery<InspectionResponse[]>({
    queryKey: ['inspections', 'overdue', scope],
    queryFn: async () => {
      const response = await apiClient.get<InspectionResponse[]>(
        '/api/inspections/status/overdue',
      );
      return response.data;
    },
    enabled: !!scope,
  });
};

// Get inspections due today
export const useDueTodayInspections = () => {
  const scope = useApiaryScope();
  return useQuery<InspectionResponse[]>({
    queryKey: ['inspections', 'due-today', scope],
    queryFn: async () => {
      const response = await apiClient.get<InspectionResponse[]>(
        '/api/inspections/status/due-today',
      );
      return response.data;
    },
    enabled: !!scope,
  });
};

// Get upcoming inspections (future pending inspections)
export const useUpcomingInspections = (limit?: number) => {
  const scope = useApiaryScope();
  return useQuery<InspectionResponse[]>({
    queryKey: ['inspections', 'upcoming', scope, limit],
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
    enabled: !!scope,
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

/**
 * A treatment form entry as API details. Shared by inspections, the hive's
 * Add Actions dialog and Bulk Add, so none of them drops the catalog product
 * (which drives ingredient totals and withdrawal) or the mite counts.
 */
export const treatmentDetails = (
  action: TreatmentActionData,
): TreatmentActionDetails => ({
  type: ActionType.TREATMENT,
  product: action.treatmentType,
  productId: action.productId ?? null,
  quantity: action.amount,
  unit: action.unit,
  miteCountMethod:
    (action.miteCountMethod as TreatmentActionDetails['miteCountMethod']) ??
    null,
  miteCountBefore: action.miteCountBefore ?? null,
  miteCountAfter: action.miteCountAfter ?? null,
  miteSampleSize: action.miteSampleSize ?? null,
});

// Transform form-shape actions into API CreateAction[]. Shared between the
// single-inspection upsert flow and the bulk-add flow.
export const transformActionsForApi = (
  actions: ActionData[] | undefined,
): CreateAction[] => {
  if (!actions) return [];
  return actions
    .map((action): CreateAction | null => {
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
              feedTypeId: action.feedTypeId,
              enteredAmount: action.enteredAmount,
              enteredUnit: action.enteredUnit,
              amountG: action.amountG,
              density: action.density,
              sugarContent: action.sugarContent,
              sugarG: action.sugarG,
              waterAddedMl: action.waterAddedMl,
            },
          };
        case 'TREATMENT':
          return {
            type: action.type,
            notes: action.notes,
            details: treatmentDetails(action),
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
              component: action.component as 'BOX' | 'BOTTOM_BOARD' | 'COVER',
              status: action.status as 'REPLACED' | 'CLEANED',
            },
          };
        case 'STATUS_CHANGE':
          return {
            type: ActionType.STATUS_CHANGE,
            notes: action.notes,
            details: {
              type: ActionType.STATUS_CHANGE,
              toStatus: action.toStatus,
            },
          };
        case 'BOX_CONFIGURATION':
          // updatedBoxes is only set when the configurator was confirmed in
          // this session; it goes out as the layout for the backend to apply
          // (it recomputes the counts). Without it, a box change saved earlier
          // is kept as is.
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
              boxes: (action.updatedBoxes?.map(b => ({
                type: b.type,
                frameCount: b.frameCount,
              })) ?? action.boxesSummary) as
                { type: BoxTypeEnum; frameCount: number }[] | undefined,
              layout: action.updatedBoxes?.map(box => ({
                ...box,
                // Boxes added in the configurator only have a temporary id
                id: box.id?.startsWith('temp-') ? undefined : box.id,
              })),
            },
          };
        default:
          return null;
      }
    })
    .filter((a): a is CreateAction => Boolean(a));
};

// Create a new inspection. Accepts either a bare CreateInspection payload or an
// object with an explicit target apiaryId (for cross-apiary writes in view-all
// mode — the inspection's hive may live in a non-active apiary).
export const useCreateInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: CreateInspection | { data: CreateInspection; apiaryId?: string },
    ) => {
      const { data, apiaryId } =
        'data' in input ? input : { data: input, apiaryId: undefined };
      const response = await apiClient.post<CreateInspectionResponse>(
        `/api/inspections`,
        data,
        apiaryHeaderConfig(apiaryId),
      );

      return response.data;
    },
    onSuccess: async () => {
      // Invalidate inspection lists to refresh data
      await queryClient.invalidateQueries({
        queryKey: INSPECTIONS_KEYS.lists(),
      });
      // Frame actions can change the hive's brood-box frame counts
      await queryClient.invalidateQueries({ queryKey: ['hives'] });
      await invalidateTreatmentTotals(queryClient);
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
      apiaryId,
    }: {
      id: string;
      data: UpdateInspection;
      apiaryId?: string;
    }) => {
      const response = await apiClient.patch<UpdateInspectionResponse>(
        `/api/inspections/${id}`,
        data,
        apiaryHeaderConfig(apiaryId),
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
      // Frame actions can change the hive's brood-box frame counts
      await queryClient.invalidateQueries({ queryKey: ['hives'] });
      await invalidateTreatmentTotals(queryClient);
    },
  });
};

// Delete an inspection. With revertHiveChanges, the backend first undoes the
// inspection's box and frame changes to the hive (see inspections.service).
export const useDeleteInspection = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('inspection');

  return useMutation({
    mutationFn: async ({
      id,
      revertHiveChanges,
      apiaryId,
    }: {
      id: string;
      revertHiveChanges?: boolean;
      apiaryId?: string;
    }) => {
      await apiClient.delete(`/api/inspections/${id}`, {
        params: revertHiveChanges ? { revertHiveChanges: 'true' } : undefined,
        ...apiaryHeaderConfig(apiaryId),
      });
      return id;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: INSPECTIONS_KEYS.lists() }),
        // Undoing hive changes rewrites the hive's boxes
        queryClient.invalidateQueries({ queryKey: ['hives'] }),
        invalidateTreatmentTotals(queryClient),
      ]);
    },
    onError: () => {
      toast.error(t('detailSidebar.deleteFailed'));
    },
  });
};

export const useUpsertInspection = (
  inspectionId?: string,
  options?: {
    onBeforeNavigate?: (inspectionId: string) => Promise<void>;
    // Target apiary of the inspection's hive. Sent as x-apiary-id so the write
    // works in view-all mode when the hive is not in the active apiary.
    apiaryId?: string;
  },
) => {
  const { mutateAsync: createInspectionMutation } = useCreateInspection();
  const { mutateAsync: updateInspectionMutation } = useUpdateInspection();
  const { t } = useTranslation('inspection');
  const { parseWeight } = useUnitFormat();
  const navigate = useNavigate();

  return async (data: InspectionFormData, status?: InspectionStatus) => {
    // Build score override if custom scores were set
    const scoreOverride = data.score
      ? {
          overallScore: data.score.overallScore ?? null,
          populationScore: data.score.populationScore ?? null,
          storesScore: data.score.storesScore ?? null,
          queenScore: data.score.queenScore ?? null,
        }
      : undefined;

    // Convert weight readings from the user's display unit to canonical kg.
    const formattedWeights = data.weights?.map(w => ({
      ...w,
      value: parseWeight(w.value),
      unit: 'kg',
    }));

    // A box configuration action carries the new layout; the backend applies
    // it to the hive in the same transaction as the inspection.
    const formattedData = {
      ...data,
      date: toInspectionDateISOString(data.date, data.isAllDay ?? true),
      status: status || data.status,
      actions: transformActionsForApi(data.actions),
      score: scoreOverride,
      weights: formattedWeights,
    };

    const res = inspectionId
      ? await updateInspectionMutation({
          id: inspectionId,
          data: { ...formattedData, id: inspectionId },
          apiaryId: options?.apiaryId,
        })
      : await createInspectionMutation({
          data: formattedData,
          apiaryId: options?.apiaryId,
        });

    toast.success(t('messages.savedSuccessfully'));
    await options?.onBeforeNavigate?.(res.id);
    navigate(`/inspections/${res.id}`);
  };
};
