import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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

const REMINDER_KEYS = new Set([
  'honey_bound',
  'overcrowded',
  'needs_super',
  'queen_issues',
  'requires_treatment',
  'low_stores',
  'prepare_for_winter',
]);

function describeAction(
  suggestion: AssistantActionSuggestion,
  t: TFunction<'ai'>,
): string {
  const d = suggestion.details;
  switch (d.type) {
    case 'FEEDING':
      return d.concentration
        ? t('assistant.describe.feedWithConcentration', {
            amount: d.amount,
            unit: d.unit,
            feedType: d.feedType,
            concentration: d.concentration,
          })
        : t('assistant.describe.feed', {
            amount: d.amount,
            unit: d.unit,
            feedType: d.feedType,
          });
    case 'TREATMENT':
      return d.quantity
        ? t('assistant.describe.treatWithQuantity', {
            product: d.product,
            quantity: d.quantity,
            unit: d.unit,
          })
        : t('assistant.describe.treat', { product: d.product });
    case 'FRAME':
      return d.quantity >= 0
        ? t('assistant.describe.addFrames', { count: d.quantity })
        : t('assistant.describe.removeFrames', {
            count: Math.abs(d.quantity),
          });
    case 'MAINTENANCE': {
      const component = d.component.replace('_', ' ').toLowerCase();
      return d.status === 'CLEANED'
        ? t('assistant.describe.cleaned', { component })
        : t('assistant.describe.replaced', { component });
    }
    case 'HARVEST':
      return t('assistant.describe.harvest', {
        amount: d.amount,
        unit: d.unit,
      });
    case 'NOTE':
      return t('assistant.describe.note', { content: d.content });
    default:
      return suggestion.type;
  }
}

export function AssistantSuggestionList({ suggestions, hiveId }: Props) {
  const { t } = useTranslation('ai');
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
      toast.success(t('assistant.suggestions.created'));
    } catch {
      toast.error(t('assistant.suggestions.createFailed'));
    }
  };

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-stone-200 dark:border-stone-700 pt-2">
      <span className="text-xs font-medium text-muted-foreground">
        {t('assistant.suggestions.title')}
      </span>
      {suggestions.map((suggestion: AssistantSuggestion, index) => {
        if (suggestion.kind === 'reminder') {
          return (
            <div key={index} className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {t('assistant.suggestions.reminder')}
              </Badge>
              <span className="text-xs">
                {REMINDER_KEYS.has(suggestion.reminder)
                  ? t(`assistant.reminders.${suggestion.reminder}`)
                  : suggestion.reminder}
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
                {describeAction(suggestion, t)}
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
                  <Check className="mr-1 h-3 w-3" />{' '}
                  {t('assistant.suggestions.createdLabel')}
                </>
              ) : (
                <>
                  <Plus className="mr-1 h-3 w-3" />{' '}
                  {t('assistant.suggestions.createAction')}
                </>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
