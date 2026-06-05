import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { BotMessageSquare, Copy, Check, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useHive, useInspections, useCreateAssistantThread } from '@/api/hooks';
import { useFeatures } from '@/api/hooks/useFeatures';
import { generateHivePrompt } from './generate-hive-prompt';
import { useTranslation } from 'react-i18next';

interface LlmPromptDialogProps {
  hiveId: string;
  hiveName: string;
}

export function LlmPromptDialog({ hiveId, hiveName }: LlmPromptDialogProps) {
  const [open, setOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();
  const { data: hive } = useHive(hiveId, { enabled: !!hiveId });
  const { data: inspections } = useInspections(hiveId ? { hiveId } : undefined);
  const { data: features } = useFeatures();
  const createThread = useCreateAssistantThread();
  const { t } = useTranslation('hive');
  useEffect(() => {
    if (open && hive) {
      setPromptText(generateHivePrompt(hive, inspections));
    }
  }, [open, hive, inspections]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      toast.success(
        t('llmPrompt.promptCopiedToClipboard', {
          defaultValue: 'Prompt copied to clipboard',
        }),
      );
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(
        t('llmPrompt.failedToCopyPromptToClipboard', {
          defaultValue: 'Failed to copy prompt to clipboard',
        }),
      );
    }
  };

  const handleSendToAssistant = async () => {
    if (!hive?.apiaryId) return;
    try {
      const thread = await createThread.mutateAsync({
        apiaryId: hive.apiaryId,
        hiveId,
      });
      setOpen(false);
      // Re-navigate to this hive's Assistant tab, handing off the thread id and
      // the generated prompt via router state (no URL length limit). The hive
      // detail page reads this and auto-sends the prompt.
      navigate(`/hives/${hiveId}`, {
        state: {
          assistantTab: true,
          assistantThreadId: thread.id,
          assistantPrompt: promptText,
        },
      });
    } catch {
      toast.error(
        t('llmPrompt.failedToSendToAssistant', {
          defaultValue: 'Could not open the assistant',
        }),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start"
          size="sm"
          data-umami-event="LLM Prompt Open"
        >
          <BotMessageSquare className="mr-2 h-4 w-4" />
          {t('manage.llmPrompt', { defaultValue: 'LLM Prompt' })}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {t('llmPrompt.title', {
              hiveName: hiveName,
              defaultValue: 'LLM Prompt for {{hiveName}}',
            })}
          </DialogTitle>
          <DialogDescription>
            {t('llmPrompt.description', {
              hiveName: hiveName,
              defaultValue:
                'Copy this prompt and paste it into your preferred AI assistant for a\n' +
                'hive health assessment. You can edit the text before copying.',
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <Textarea
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            className="flex-1 min-h-[300px] max-h-[50vh] font-mono text-sm resize-none"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {t('llmPrompt.charactersLength', { length: promptText.length, defaultValue: '{{length}} characters' })}
            </span>
            <div className="flex items-center gap-2">
              {features?.aiEnabled && hive?.apiaryId && (
                <Button
                  variant="secondary"
                  onClick={() => void handleSendToAssistant()}
                  disabled={createThread.isPending || !promptText}
                  data-umami-event="LLM Prompt Send To Assistant"
                >
                  {createThread.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {t('llmPrompt.sendToAssistant', {
                    defaultValue: 'Send to AI-Assistant',
                  })}
                </Button>
              )}
              <Button onClick={handleCopy} data-umami-event="LLM Prompt Copy">
                {copied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied
                  ? t('llmPrompt.promptCopied', {
                      defaultValue: 'Copied',
                    })
                  : t('llmPrompt.promptCopyToClipboard', {
                      defaultValue: 'Copy to Clipboard',
                    })}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
