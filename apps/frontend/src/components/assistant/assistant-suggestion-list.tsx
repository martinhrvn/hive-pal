import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCreateAction } from '@/api/hooks';
import type {
  AssistantSuggestion,
  AssistantSuggestions,
  AssistantActionSuggestion,
} from 'shared-schemas';

interface Props {
  suggestions: AssistantSuggestions;
  hiveId: string;
}

const REMINDER_LABELS: Record<string, string> = {
  honey_bound: 'Honey bound',
  overcrowded: 'Overcrowded',
  needs_super: 'Needs super',
  queen_issues: 'Queen issues',
  requires_treatment: 'Requires treatment',
  low_stores: 'Low stores',
  prepare_for_winter: 'Prepare for winter',
};

function describeAction(suggestion: AssistantActionSuggestion): string {
  const d = suggestion.details;
  switch (d.type) {
    case 'FEEDING':
      return `Feed ${d.amount} ${d.unit} of ${d.feedType}${
        d.concentration ? ` (${d.concentration})` : ''
      }`;
    case 'TREATMENT':
      return `Treat with ${d.product}${
        d.quantity ? ` (${d.quantity} ${d.unit})` : ''
      }`;
    case 'FRAME':
      return d.quantity >= 0
        ? `Add ${d.quantity} frame${d.quantity === 1 ? '' : 's'}`
        : `Remove ${Math.abs(d.quantity)} frame${d.quantity === -1 ? '' : 's'}`;
    case 'MAINTENANCE':
      return `${d.status.toLowerCase()} ${d.component
        .replace('_', ' ')
        .toLowerCase()}`;
    case 'HARVEST':
      return `Harvest ${d.amount} ${d.unit}`;
    case 'NOTE':
      return `Note: ${d.content}`;
    default:
      return suggestion.type;
  }
}

export function AssistantSuggestionList({ suggestions, hiveId }: Props) {
  const createAction = useCreateAction();
  const [created, setCreated] = useState<Record<number, boolean>>({});

  const handleCreate = async (
    suggestion: AssistantActionSuggestion,
    index: number,
  ) => {
    try {
      await createAction.mutateAsync({
        hiveId,
        type: suggestion.type,
        details: suggestion.details,
        notes: suggestion.notes,
      });
      setCreated(prev => ({ ...prev, [index]: true }));
      toast.success('Action created');
    } catch {
      toast.error('Could not create the action');
    }
  };

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-stone-200 dark:border-stone-700 pt-2">
      <span className="text-xs font-medium text-muted-foreground">
        Suggested actions
      </span>
      {suggestions.map((suggestion: AssistantSuggestion, index) => {
        if (suggestion.kind === 'reminder') {
          return (
            <div key={index} className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Reminder
              </Badge>
              <span className="text-xs">
                {REMINDER_LABELS[suggestion.reminder] ?? suggestion.reminder}
                {suggestion.reason ? ` — ${suggestion.reason}` : ''}
              </span>
            </div>
          );
        }

        return (
          <div
            key={index}
            className="flex items-start justify-between gap-2 rounded-md bg-background/60 p-2"
          >
            <div className="min-w-0">
              <div className="text-xs font-medium">
                {describeAction(suggestion)}
              </div>
              {suggestion.reason && (
                <div className="text-xs text-muted-foreground">
                  {suggestion.reason}
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant={created[index] ? 'ghost' : 'outline'}
              className="shrink-0 h-7"
              disabled={created[index] || createAction.isPending}
              onClick={() => void handleCreate(suggestion, index)}
            >
              {created[index] ? (
                <>
                  <Check className="mr-1 h-3 w-3" /> Created
                </>
              ) : (
                <>
                  <Plus className="mr-1 h-3 w-3" /> Create action
                </>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
