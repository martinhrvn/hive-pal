import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, FormProvider } from 'react-hook-form';
import { format } from 'date-fns';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FeedingForm,
  type FeedingActionType,
} from '@/pages/inspection/components/inspection-form/actions/feeding';
import {
  TreatmentForm,
  type TreatmentActionType,
} from '@/pages/inspection/components/inspection-form/actions/treatment';
import {
  FramesForm,
  type FramesActionType,
} from '@/pages/inspection/components/inspection-form/actions/frames';
import {
  NoteForm,
  type NoteActionType,
} from '@/pages/inspection/components/inspection-form/actions/note';
import type {
  ActionData,
  FeedingActionData,
  TreatmentActionData,
  FramesActionData,
  NoteActionData,
} from '@/pages/inspection/components/inspection-form/schema';
import { ActionType } from 'shared-schemas';
import type {
  BulkInspectionPayload,
  BulkQueenPayload,
  StagedItem,
} from './types';

interface StagedQueueProps {
  items: StagedItem[];
  onRemove: (id: string) => void;
  onUpdateAction: (id: string, action: ActionData) => void;
}

const kindBadgeVariant = (kind: StagedItem['kind']) => {
  switch (kind) {
    case 'action':
      return 'secondary' as const;
    case 'inspection':
      return 'default' as const;
    case 'queen':
      return 'outline' as const;
  }
};

const formatActionDetails = (action: ActionData): string => {
  const parts: string[] = [];
  switch (action.type) {
    case 'FEEDING': {
      const a = action as FeedingActionData;
      if (a.feedType) parts.push(a.feedType.replace('_', ' '));
      parts.push(`${a.quantity} ${a.unit}`);
      if (a.concentration) parts.push(`(${a.concentration})`);
      break;
    }
    case 'TREATMENT': {
      const a = action as TreatmentActionData;
      if (a.treatmentType) parts.push(a.treatmentType);
      parts.push(`${a.amount} ${a.unit}`);
      break;
    }
    case 'FRAME': {
      const a = action as FramesActionData;
      parts.push(`${a.frames} frames`);
      break;
    }
    case 'NOTE': {
      const a = action as NoteActionData;
      const content = a.notes || '';
      parts.push(content.slice(0, 50) + (content.length > 50 ? '…' : ''));
      break;
    }
    case 'MAINTENANCE':
      parts.push(`${action.component} — ${action.status}`);
      break;
  }
  return parts.filter(Boolean).join(' · ');
};

const formatInspectionSummary = (p: BulkInspectionPayload): string => {
  const parts: string[] = [];
  const obs = p.observations;
  if (obs?.strength != null) parts.push(`strength ${obs.strength}`);
  if (obs?.queenSeen) parts.push('queen seen');
  if (p.actions?.length) parts.push(`${p.actions.length} action(s)`);
  if (p.notes) {
    parts.push(`"${p.notes.slice(0, 30)}${p.notes.length > 30 ? '…' : ''}"`);
  }
  return parts.length ? parts.join(' · ') : 'Inspection';
};

const formatQueenSummary = (q: BulkQueenPayload): string => {
  const parts: string[] = [`Year ${q.year}`];
  if (q.color) parts.push(q.color);
  if (q.marking) parts.push(`mark "${q.marking}"`);
  parts.push(q.status);
  return parts.join(' · ');
};

const renderItemSummary = (item: StagedItem): string => {
  if (item.kind === 'action') return formatActionDetails(item.action);
  if (item.kind === 'inspection') return formatInspectionSummary(item.inspection);
  return formatQueenSummary(item.queen);
};

const renderItemSubtype = (item: StagedItem): string | null => {
  if (item.kind === 'action') return item.action.type;
  return null;
};

export const StagedQueue: React.FC<StagedQueueProps> = ({
  items,
  onRemove,
  onUpdateAction,
}) => {
  const { t } = useTranslation('common');
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingItem = items.find(i => i.id === editingId);
  const kindLabel = (kind: StagedItem['kind']) => t(`bulkAdd.kind.${kind}`);

  const editMethods = useForm<{ actions: ActionData[] }>({
    defaultValues: { actions: [] },
  });

  const handleStartEdit = (item: StagedItem) => {
    if (item.kind !== 'action') return;
    editMethods.setValue('actions', [item.action]);
    setEditingId(item.id);
  };

  const handleSaveEdit = () => {
    if (!editingItem || editingItem.kind !== 'action') return;
    const edited = editMethods.getValues('actions');
    if (edited.length > 0) {
      onUpdateAction(editingItem.id, edited[0]);
    }
    setEditingId(null);
  };

  const renderEditForm = () => {
    if (!editingItem || editingItem.kind !== 'action') return null;
    const action = editingItem.action;

    const noOpRemove = () => {
      /* edit dialog doesn't expose remove */
    };

    switch (action.type) {
      case 'FEEDING': {
        const fd = action as FeedingActionData;
        const initial: FeedingActionType = {
          type: 'FEEDING',
          feedType: fd.feedType,
          quantity: fd.quantity,
          unit: fd.unit,
          concentration: fd.concentration,
          notes: fd.notes,
        };
        const handleSave = (updated: FeedingActionType) => {
          editMethods.setValue('actions', [
            {
              type: ActionType.FEEDING,
              feedType: updated.feedType,
              quantity: updated.quantity,
              unit: updated.unit,
              concentration: updated.concentration,
              notes: updated.notes,
            },
          ]);
        };
        return (
          <FeedingForm action={initial} onSave={handleSave} onRemove={noOpRemove} />
        );
      }
      case 'TREATMENT': {
        const td = action as TreatmentActionData;
        const initial: TreatmentActionType = {
          type: 'TREATMENT',
          treatmentType: td.treatmentType,
          amount: td.amount,
          unit: td.unit,
          notes: td.notes,
        };
        const handleSave = (updated: TreatmentActionType) => {
          editMethods.setValue('actions', [
            {
              type: ActionType.TREATMENT,
              treatmentType: updated.treatmentType,
              amount: updated.amount ?? 0,
              unit: updated.unit,
              notes: updated.notes,
            },
          ]);
        };
        return (
          <TreatmentForm
            action={initial}
            onSave={handleSave}
            onRemove={noOpRemove}
          />
        );
      }
      case 'FRAME': {
        const ff = action as FramesActionData;
        const initial: FramesActionType = {
          type: 'FRAME',
          frames: ff.frames,
          notes: ff.notes,
        };
        const handleSave = (updated: FramesActionType) => {
          editMethods.setValue('actions', [
            {
              type: ActionType.FRAME,
              frames: updated.frames,
              notes: updated.notes,
            },
          ]);
        };
        return (
          <FramesForm action={initial} onSave={handleSave} onRemove={noOpRemove} />
        );
      }
      case 'NOTE': {
        const handleSave = (updated: NoteActionType) => {
          editMethods.setValue('actions', [
            { type: ActionType.NOTE, notes: updated.notes },
          ]);
        };
        return <NoteForm onSave={handleSave} onRemove={noOpRemove} />;
      }
      default:
        return null;
    }
  };

  return (
    <>
      <div className="divide-y rounded-md border bg-card">
        {items.map(item => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-2 px-3 py-2.5 hover:bg-accent/40 transition-colors first:rounded-t-md last:rounded-b-md"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-sm">
                  {item.hiveName}
                </span>
                <Badge
                  variant={kindBadgeVariant(item.kind)}
                  className="shrink-0 text-[10px] uppercase tracking-wide"
                >
                  {kindLabel(item.kind)}
                  {renderItemSubtype(item) && ` · ${renderItemSubtype(item)}`}
                </Badge>
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {renderItemSummary(item)}
              </div>
              {item.kind === 'action' &&
                'notes' in item.action &&
                item.action.notes && (
                  <div className="truncate text-xs italic text-muted-foreground">
                    {item.action.notes}
                  </div>
                )}
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                {format(item.date, 'MMM d, yyyy')}
              </div>
            </div>
            <div className="flex shrink-0 gap-0.5">
              {item.kind === 'action' && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => handleStartEdit(item)}
                  aria-label="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => onRemove(item.id)}
                aria-label="Remove"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={!!editingItem}
        onOpenChange={open => !open && setEditingId(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('bulkAdd.edit.title')}</DialogTitle>
          </DialogHeader>
          {editingItem && editingItem.kind === 'action' && (
            <FormProvider {...editMethods}>
              <form onSubmit={e => e.preventDefault()}>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>{t('bulkAdd.edit.hive')}</Label>
                      <Input value={editingItem.hiveName} disabled />
                    </div>
                    <div>
                      <Label>{t('bulkAdd.edit.type')}</Label>
                      <Input value={editingItem.action.type} disabled />
                    </div>
                    <div>
                      <Label>{t('bulkAdd.edit.date')}</Label>
                      <Input value={format(editingItem.date, 'PPP')} disabled />
                    </div>
                  </div>
                  <div className="mt-6">{renderEditForm()}</div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      {t('bulkAdd.edit.cancel')}
                    </Button>
                    <Button type="button" onClick={handleSaveEdit}>
                      <Check className="mr-2 h-4 w-4" />
                      {t('bulkAdd.edit.save')}
                    </Button>
                  </div>
                </div>
              </form>
            </FormProvider>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
