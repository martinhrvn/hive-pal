import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { toast } from 'sonner';
import {
  ActiveIngredient,
  AppliedIngredientTotal,
  CreateActiveIngredientDto,
  CreateTreatmentProductDto,
  TreatmentProduct,
  UpdateTreatmentProductDto,
} from 'shared-schemas';
import { AxiosError } from 'axios';

const TP_KEYS = {
  all: ['treatment-products'] as const,
  lists: () => [...TP_KEYS.all, 'list'] as const,
  ingredients: () => ['active-ingredients'] as const,
  hiveSummary: (hiveId: string) =>
    [...TP_KEYS.all, 'hive-summary', hiveId] as const,
  apiaryTotals: (apiaryId: string) =>
    [...TP_KEYS.all, 'apiary-totals', apiaryId] as const,
};

const errMsg = (e: AxiosError<{ message?: string }>, fallback: string) =>
  e.response?.data?.message ?? fallback;

export const useTreatmentProducts = () =>
  useQuery<TreatmentProduct[]>({
    queryKey: TP_KEYS.lists(),
    queryFn: async () =>
      (await apiClient.get<TreatmentProduct[]>('/api/treatment-products')).data,
  });

export const useActiveIngredients = () =>
  useQuery<ActiveIngredient[]>({
    queryKey: TP_KEYS.ingredients(),
    queryFn: async () =>
      (await apiClient.get<ActiveIngredient[]>('/api/active-ingredients')).data,
  });

export const useCreateTreatmentProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateTreatmentProductDto) =>
      (await apiClient.post<TreatmentProduct>('/api/treatment-products', dto))
        .data,
    onSuccess: () => {
      toast.success('Treatment product created');
      qc.invalidateQueries({ queryKey: TP_KEYS.lists() });
    },
    onError: (e: AxiosError<{ message?: string }>) =>
      toast.error(errMsg(e, 'Failed to create product')),
  });
};

export const useUpdateTreatmentProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateTreatmentProductDto;
    }) =>
      (await apiClient.put<TreatmentProduct>(
        `/api/treatment-products/${id}`,
        dto,
      )).data,
    onSuccess: () => {
      toast.success('Treatment product updated');
      qc.invalidateQueries({ queryKey: TP_KEYS.lists() });
    },
    onError: (e: AxiosError<{ message?: string }>) =>
      toast.error(errMsg(e, 'Failed to update product')),
  });
};

export const useDeleteTreatmentProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await apiClient.delete(`/api/treatment-products/${id}`)).data,
    onSuccess: () => {
      toast.success('Treatment product deleted');
      qc.invalidateQueries({ queryKey: TP_KEYS.lists() });
    },
    onError: (e: AxiosError<{ message?: string }>) =>
      toast.error(errMsg(e, 'Failed to delete product')),
  });
};

export const useCreateActiveIngredient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateActiveIngredientDto) =>
      (await apiClient.post<ActiveIngredient>('/api/active-ingredients', dto))
        .data,
    onSuccess: () => {
      toast.success('Active ingredient added');
      qc.invalidateQueries({ queryKey: TP_KEYS.ingredients() });
    },
    onError: (e: AxiosError<{ message?: string }>) =>
      toast.error(errMsg(e, 'Failed to add ingredient')),
  });
};

// --- Per-colony aggregation views ---

export interface HiveTreatmentSummary {
  hiveId: string;
  from: string | null;
  to: string | null;
  ingredientTotals: AppliedIngredientTotal[];
  withdrawal: {
    inWithdrawal: boolean;
    until: string | null;
    product: { id: string; name: string } | null;
  };
}

export const useHiveTreatmentSummary = (
  hiveId: string | undefined,
  range?: { from?: string; to?: string },
) =>
  useQuery<HiveTreatmentSummary>({
    queryKey: [...TP_KEYS.hiveSummary(hiveId ?? ''), range?.from, range?.to],
    enabled: !!hiveId,
    queryFn: async () =>
      (
        await apiClient.get<HiveTreatmentSummary>(
          `/api/hives/${hiveId}/treatment-summary`,
          { params: { from: range?.from, to: range?.to } },
        )
      ).data,
  });

export interface ApiaryTreatmentTotals {
  apiaryId: string;
  from: string | null;
  to: string | null;
  byHive: Array<{
    hiveId: string;
    hiveName: string;
    ingredientTotals: AppliedIngredientTotal[];
  }>;
}

export const useApiaryTreatmentTotals = (
  apiaryId: string | undefined,
  range?: { from?: string; to?: string },
) =>
  useQuery<ApiaryTreatmentTotals>({
    queryKey: [
      ...TP_KEYS.apiaryTotals(apiaryId ?? ''),
      range?.from,
      range?.to,
    ],
    enabled: !!apiaryId,
    queryFn: async () =>
      (
        await apiClient.get<ApiaryTreatmentTotals>(
          `/api/apiaries/${apiaryId}/treatment-ingredient-totals`,
          { params: { from: range?.from, to: range?.to } },
        )
      ).data,
  });
