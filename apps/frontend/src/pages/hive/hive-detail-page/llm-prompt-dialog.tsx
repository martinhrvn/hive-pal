import { useState, useEffect } from 'react';
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
import { BotMessageSquare, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useHive, useInspections } from '@/api/hooks';
import { generateHivePrompt } from './generate-hive-prompt';

interface LlmPromptDialogProps {
  hiveId: string;
  hiveName: string;
}

export function LlmPromptDialog({ hiveId, hiveName }: LlmPromptDialogProps) {
  const [open, setOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: hive } = useHive(hiveId, { enabled: !!hiveId });
  const { data: inspections } = useInspections(hiveId ? { hiveId } : undefined);

  useEffect(() => {
    if (open && hive) {
      setPromptText(generateHivePrompt(hive, inspections));
    }
  }, [open, hive, inspections]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      toast.success('Prompt copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start" size="sm">
          <BotMessageSquare className="mr-2 h-4 w-4" />
          LLM Prompt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>LLM Prompt for {hiveName}</DialogTitle>
          <DialogDescription>
            Copy this prompt and paste it into your preferred AI assistant for a
            hive health assessment. You can edit the text before copying.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <Textarea
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            className="flex-1 min-h-[300px] max-h-[50vh] font-mono text-sm resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {promptText.length} characters
            </span>
            <Button onClick={handleCopy}>
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? 'Copied' : 'Copy to Clipboard'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
