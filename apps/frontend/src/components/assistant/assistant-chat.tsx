import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BotMessageSquare, Plus, Send, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  ASSISTANT_KEYS,
  useAssistantThread,
  useAssistantThreads,
  useCreateAssistantThread,
  useDeleteAssistantThread,
  streamAssistantMessage,
} from '@/api/hooks';
import type { AssistantMessageResponse } from 'shared-schemas';
import { AssistantSuggestionList } from './assistant-suggestion-list';

interface AssistantChatProps {
  apiaryId: string;
  hiveId?: string;
  threadId?: string;
  /**
   * When provided, this message is sent automatically once on mount (used by
   * the "Send to AI-Assistant" action in the LLM prompt dialog). Pair it with a
   * `key` on the component so a fresh instance mounts per injected message.
   */
  initialMessage?: string;
}

type PendingMessage = Pick<AssistantMessageResponse, 'role' | 'content'> & {
  id: string;
};

export function AssistantChat({
  apiaryId,
  hiveId,
  threadId,
  initialMessage,
}: AssistantChatProps) {
  const queryClient = useQueryClient();
  const { data: threads } = useAssistantThreads(apiaryId, hiveId);
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(
    threadId,
  );
  const { data: thread } = useAssistantThread(activeThreadId);

  const createThread = useCreateAssistantThread();
  const deleteThread = useDeleteAssistantThread(apiaryId, hiveId);

  const [input, setInput] = useState('');
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-select the most recent thread when none is chosen yet.
  useEffect(() => {
    if (!activeThreadId && threads && threads.length > 0) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId]);

  const messages = thread?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, streamingText, pending.length]);

  const sendMessage = async (rawContent: string) => {
    const content = rawContent.trim();
    if (!content || isStreaming) return;

    let targetThreadId = activeThreadId;
    if (!targetThreadId) {
      try {
        const created = await createThread.mutateAsync({ apiaryId, hiveId });
        targetThreadId = created.id;
        setActiveThreadId(created.id);
      } catch {
        toast.error('Could not start a new chat');
        return;
      }
    }

    setInput('');
    setPending([{ id: `pending-${Date.now()}`, role: 'USER', content }]);
    setStreamingText('');
    setIsStreaming(true);

    try {
      await streamAssistantMessage(
        targetThreadId,
        content,
        apiaryId,
        {
          onToken: token => setStreamingText(prev => prev + token),
          onDone: () => {
            void queryClient.invalidateQueries({
              queryKey: ASSISTANT_KEYS.thread(targetThreadId!),
            });
            void queryClient.invalidateQueries({
              queryKey: ASSISTANT_KEYS.threads(apiaryId, hiveId),
            });
            setPending([]);
            setStreamingText('');
            setIsStreaming(false);
          },
          onError: message => {
            toast.error(message);
            setIsStreaming(false);
          },
        },
      );
    } catch {
      toast.error('The assistant is unavailable right now');
      setIsStreaming(false);
    }
  };

  const handleSend = () => void sendMessage(input);

  // Auto-send a prompt injected from elsewhere (e.g. the LLM prompt dialog).
  const autoSentRef = useRef(false);
  useEffect(() => {
    if (initialMessage && !autoSentRef.current) {
      autoSentRef.current = true;
      void sendMessage(initialMessage);
    }
    // sendMessage intentionally omitted — guarded to run exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  const handleNewThread = () => {
    setActiveThreadId(undefined);
    setPending([]);
    setStreamingText('');
  };

  const handleDeleteThread = async () => {
    if (!activeThreadId) return;
    try {
      await deleteThread.mutateAsync(activeThreadId);
      setActiveThreadId(undefined);
    } catch {
      toast.error('Could not delete this chat');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Thread controls */}
      <div className="flex items-center gap-2">
        <BotMessageSquare className="h-4 w-4 text-amber-600 shrink-0" />
        <Select
          value={activeThreadId ?? ''}
          onValueChange={value => {
            setActiveThreadId(value);
            setPending([]);
            setStreamingText('');
          }}
          disabled={!threads || threads.length === 0}
        >
          <SelectTrigger className="h-8 flex-1 text-sm">
            <SelectValue placeholder="New conversation" />
          </SelectTrigger>
          <SelectContent>
            {threads?.map(t => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewThread}
          title="New conversation"
        >
          <Plus className="h-4 w-4" />
        </Button>
        {activeThreadId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleDeleteThread()}
            title="Delete conversation"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-700 py-2">
        <AlertDescription className="text-xs">
          Advice is advisory only. Treatment products and dosing are regionally
          regulated — always follow the product label and local rules.
        </AlertDescription>
      </Alert>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex flex-col gap-3 overflow-y-auto rounded-lg border border-stone-200 dark:border-stone-800 bg-card p-3 min-h-[280px] max-h-[50vh]"
      >
        {messages.length === 0 && pending.length === 0 && !streamingText && (
          <p className="text-sm text-muted-foreground m-auto text-center">
            Ask about this {hiveId ? 'hive' : 'apiary'} — health, feeding,
            swarm risk, seasonal next steps.
          </p>
        )}

        {messages.map(message => (
          <ChatBubble
            key={message.id}
            role={message.role}
            content={message.content}
          >
            {message.role === 'ASSISTANT' &&
              message.suggestions &&
              message.suggestions.length > 0 &&
              hiveId && (
                <AssistantSuggestionList
                  suggestions={message.suggestions}
                  hiveId={hiveId}
                />
              )}
          </ChatBubble>
        ))}

        {pending.map(message => (
          <ChatBubble
            key={message.id}
            role={message.role}
            content={message.content}
          />
        ))}

        {isStreaming && (
          <ChatBubble role="ASSISTANT" content={streamingText}>
            {!streamingText && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
              </span>
            )}
          </ChatBubble>
        )}
      </div>

      {/* Composer */}
      <div className="flex items-end gap-2">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Ask the assistant…"
          className="min-h-[44px] max-h-32 resize-none text-sm"
          disabled={isStreaming}
        />
        <Button
          onClick={() => void handleSend()}
          disabled={isStreaming || !input.trim()}
          size="icon"
          className="shrink-0"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function ChatBubble({
  role,
  content,
  children,
}: {
  role: AssistantMessageResponse['role'];
  content: string;
  children?: React.ReactNode;
}) {
  const isUser = role === 'USER';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'rounded-lg px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap break-words',
          isUser
            ? 'bg-amber-600 text-white'
            : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100',
        )}
      >
        {content}
        {children}
      </div>
    </div>
  );
}
