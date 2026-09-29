import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { CreateTodo, UpdateTodo, TodoResponse } from 'shared-schemas';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useApiaryStore } from '@/hooks/use-apiary';
import { logApiError } from '../errorLogger';

// Query keys
const TODOS_KEYS = {
  all: ['todos'] as const,
  lists: () => [...TODOS_KEYS.all, 'list'] as const,
  // The active apiary is part of the key: todos are apiary-scoped (via the
  // x-apiary-id header) and the query cache is persisted, so omitting it would
  // let one apiary's list be served for another apiary.
  list: (apiaryId: string | null) => [...TODOS_KEYS.lists(), apiaryId] as const,
  details: () => [...TODOS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TODOS_KEYS.details(), id] as const,
};

// Get all todos for the active apiary (or across all apiaries in view-all mode)
export const useTodos = (
  queryOptions?: Omit<UseQueryOptions<TodoResponse[]>, 'queryKey' | 'queryFn'>,
) => {
  const activeApiaryId = useApiaryStore(state => state.activeApiaryId);
  const viewAllApiaries = useApiaryStore(state => state.viewAllApiaries);
  const scope = viewAllApiaries ? 'all' : activeApiaryId;
  return useQuery<TodoResponse[]>({
    queryKey: TODOS_KEYS.list(scope),
    enabled: !!scope && queryOptions?.enabled !== false,
    queryFn: async () => {
      try {
        const response = await apiClient.get<TodoResponse[]>('/api/todos');
        return response.data;
      } catch (error) {
        logApiError(error, '/api/todos', 'GET');
        throw error;
      }
    },
    ...queryOptions,
  });
};

// Get a single todo by ID
export const useTodo = (id: string, options = {}) => {
  return useQuery<TodoResponse>({
    queryKey: TODOS_KEYS.detail(id),
    queryFn: async () => {
      try {
        const response = await apiClient.get<TodoResponse>(`/api/todos/${id}`);
        return response.data;
      } catch (error) {
        logApiError(error, `/api/todos/${id}`, 'GET');
        throw error;
      }
    },
    enabled: !!id,
    ...options,
  });
};

// Create a new todo
export const useCreateTodo = (callbacks?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTodo) => {
      const response = await apiClient.post<TodoResponse>('/api/todos', data);
      return response.data;
    },
    onSuccess: async () => {
      callbacks?.onSuccess?.();
      await queryClient.invalidateQueries({ queryKey: TODOS_KEYS.lists() });
    },
    onError: error => {
      logApiError(error, '/api/todos', 'POST');
    },
  });
};

// Update an existing todo
export const useUpdateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTodo }) => {
      const response = await apiClient.patch<TodoResponse>(
        `/api/todos/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: TODOS_KEYS.detail(variables.id),
      });
      await queryClient.invalidateQueries({ queryKey: TODOS_KEYS.lists() });
    },
    onError: (error, variables) => {
      logApiError(error, `/api/todos/${variables.id}`, 'PATCH');
    },
  });
};

// Delete a todo
export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/todos/${id}`);
      return id;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TODOS_KEYS.lists() });
    },
    onError: (error, id) => {
      logApiError(error, `/api/todos/${id}`, 'DELETE');
    },
  });
};
