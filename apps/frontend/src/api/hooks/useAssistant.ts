import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '../client';
import {
  AssistantMessageResponse,
  AssistantThreadResponse,
  AssistantThreadWithMessagesResponse,
  CreateAssistantThread,
} from 'shared-schemas';
import { TOKEN_KEY, APIARY_SELECTION } from '@/context/auth-context';

export const ASSISTANT_KEYS = {
  all: ['assistant'] as const,
  threads: (apiaryId?: string, hiveId?: string | null) =>
    [...ASSISTANT_KEYS.all, 'threads', apiaryId ?? null, hiveId ?? null] as const,
  thread: (id: string) => [...ASSISTANT_KEYS.all, 'thread', id] as const,
};

// List threads for a scope (apiary-level when hiveId is omitted).
export const useAssistantThreads = (
  apiaryId?: string,
  hiveId?: string,
  enabled = true,
) => {
  return useQuery<AssistantThreadResponse[]>({
    queryKey: ASSISTANT_KEYS.threads(apiaryId, hiveId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (hiveId) params.append('hiveId', hiveId);
      const qs = params.toString();
      const queryString = qs ? `?${qs}` : '';
      const response = await apiClient.get<AssistantThreadResponse[]>(
        `/api/assistant/threads${queryString}`,
      );
      return response.data;
    },
    enabled: enabled && !!apiaryId,
  });
};

// Single thread with its ordered messages.
export const useAssistantThread = (threadId?: string) => {
  return useQuery<AssistantThreadWithMessagesResponse>({
    queryKey: ASSISTANT_KEYS.thread(threadId ?? ''),
    queryFn: async () => {
      const response =
        await apiClient.get<AssistantThreadWithMessagesResponse>(
          `/api/assistant/threads/${threadId}`,
        );
      return response.data;
    },
    enabled: !!threadId,
  });
};

export const useCreateAssistantThread = () => {
  const queryClient = useQueryClient();
  return useMutation<AssistantThreadResponse, Error, CreateAssistantThread>({
    mutationFn: async data => {
      const response = await apiClient.post<AssistantThreadResponse>(
        '/api/assistant/threads',
        data,
      );
      return response.data;
    },
    onSuccess: (_thread, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ASSISTANT_KEYS.threads(variables.apiaryId, variables.hiveId),
      });
    },
  });
};

export const useDeleteAssistantThread = (
  apiaryId?: string,
  hiveId?: string,
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async threadId => {
      await apiClient.delete(`/api/assistant/threads/${threadId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ASSISTANT_KEYS.threads(apiaryId, hiveId),
      });
    },
  });
};

export type AssistantStreamCallbacks = {
  onToken: (token: string) => void;
  onDone: (message: AssistantMessageResponse) => void;
  onError: (message: string) => void;
};

/**
 * Stream an assistant reply for a thread. Uses fetch + ReadableStream so we can
 * append tokens to the in-progress assistant message as the SSE events arrive.
 * The apiaryId is sent explicitly so the request is authorized against the
 * thread's apiary even if it differs from the globally selected one.
 */
export async function streamAssistantMessage(
  threadId: string,
  content: string,
  apiaryId: string,
  callbacks: AssistantStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(
    `/api/assistant/threads/${threadId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-apiary-id': apiaryId || localStorage.getItem(APIARY_SELECTION) || '',
      },
      body: JSON.stringify({ content }),
      signal,
    },
  );

  if (!response.ok || !response.body) {
    callbacks.onError(`Assistant request failed (${response.status})`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handleEvent = (raw: string) => {
    const line = raw.trim();
    if (!line.startsWith('data:')) return;
    const json = line.slice('data:'.length).trim();
    if (!json) return;
    try {
      const event = JSON.parse(json) as {
        type: 'token' | 'done' | 'error';
        content?: string;
        message?: AssistantMessageResponse;
      };
      if (event.type === 'token' && event.content) {
        callbacks.onToken(event.content);
      } else if (event.type === 'done' && event.message) {
        callbacks.onDone(event.message);
      } else if (event.type === 'error') {
        callbacks.onError(event.content ?? 'Assistant error');
      }
    } catch {
      // Skip malformed events.
    }
  };

   
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      handleEvent(chunk);
    }
  }
  if (buffer) handleEvent(buffer);
}
