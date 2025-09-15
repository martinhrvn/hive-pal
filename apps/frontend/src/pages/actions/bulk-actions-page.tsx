import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CalendarIcon, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useHives } from '@/api/hooks/useHives';
import { useCreateAction } from '@/api/hooks/useActions';
import { CreateStandaloneAction, ActionType } from 'shared-schemas';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ActionsSection } from '@/pages/inspection/components/inspection-form/actions';
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

interface StagedAction {
  id: string;
  hiveId: string;
  hiveName: string;
  action: ActionData;
  date: Date;
}

interface BulkActionFormData {
  date: Date;
  actions: ActionData[];
}

export const BulkActionsPage = () => {
  const [selectedHives, setSelectedHives] = useState<string[]>([]);
  const [stagedActions, setStagedActions] = useState<StagedAction[]>([]);
  const [editingAction, setEditingAction] = useState<StagedAction | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const editMethods = useForm({
    defaultValues: {
      actions: [] as ActionData[],
    },
  });

  const { data: hives = [], isLoading: hivesLoading } = useHives();
  const createAction = useCreateAction();

  const methods = useForm<BulkActionFormData>({
    defaultValues: {
      date: new Date(),
      actions: [],
    },
  });

  const handleHiveSelection = (hiveId: string, checked: boolean) => {
    if (checked) {
      setSelectedHives([...selectedHives, hiveId]);
    } else {
      setSelectedHives(selectedHives.filter(id => id !== hiveId));
    }
  };

  const handleAddToQueue = () => {
    const values = methods.getValues();
    const actions = values.actions || [];

    if (selectedHives.length === 0) {
      toast.error('Please select at least one hive');
      return;
    }

    if (actions.length === 0) {
      toast.error('Please add at least one action');
      return;
    }

    // Create staged actions for selected hives
    const newStagedActions: StagedAction[] = [];

    selectedHives.forEach(hiveId => {
      const hive = hives.find(h => h.id === hiveId);
      actions.forEach(action => {
        newStagedActions.push({
          id: `${hiveId}-${action.type}-${Date.now()}-${Math.random()}`,
          hiveId,
          hiveName: hive?.name || '',
          action: { ...action },
          date: values.date,
        });
      });
    });

    setStagedActions([...stagedActions, ...newStagedActions]);

    // Reset form but keep date
    const currentDate = values.date;
    methods.reset({ date: currentDate, actions: [] });
    setSelectedHives([]);

    toast.success(`Added ${newStagedActions.length} action(s) to the queue`);
  };

  const handleRemoveStagedAction = (actionId: string) => {
    setStagedActions(stagedActions.filter(a => a.id !== actionId));
  };

  const handleEditAction = (staged: StagedAction) => {
    setEditingAction({ ...staged });
    // Set the action in the edit form
    editMethods.setValue('actions', [staged.action]);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editingAction) return;

    const editedActions = editMethods.getValues('actions');
    if (editedActions.length > 0) {
      const updatedAction = {
        ...editingAction,
        action: editedActions[0],
      };

      setStagedActions(
        stagedActions.map(a => (a.id === editingAction.id ? updatedAction : a)),
      );
    }

    setEditingAction(null);
    setShowEditDialog(false);
    toast.success('Action updated');
  };

  const handleSubmitActions = async () => {
    if (stagedActions.length === 0) {
      toast.error('No actions to submit');
      return;
    }

    try {
      let successCount = 0;
      const failedActions: string[] = [];

      for (const staged of stagedActions) {
        try {
          // Map the action data from the form to the API structure
          let details: Record<string, unknown> = {};

          if (staged.action.type === 'FEEDING') {
            // Feeding: quantity -> amount
            const feedingAction = staged.action as FeedingActionData;
            details = {
              type: 'FEEDING',
              feedType: feedingAction.feedType,
              amount: feedingAction.quantity,
              unit: feedingAction.unit,
              concentration: feedingAction.concentration,
            };
          } else if (staged.action.type === 'TREATMENT') {
            // Treatment: treatmentType -> product, amount -> quantity
            const treatmentAction = staged.action as TreatmentActionData;
            details = {
              type: 'TREATMENT',
              product: treatmentAction.treatmentType,
              quantity: treatmentAction.amount,
              unit: treatmentAction.unit,
            };
          } else if (staged.action.type === 'FRAME') {
            // Frame: frames -> quantity
            const frameAction = staged.action as FramesActionData;
            details = {
              type: 'FRAME',
              quantity: frameAction.frames,
            };
          } else if (staged.action.type === 'NOTE') {
            // Note: store content in notes field
            const noteAction = staged.action as NoteActionData;
            details = {
              type: 'NOTE',
              content: noteAction.notes,
            };
          } else {
            details = {
              type: 'OTHER',
            };
          }

          const data: CreateStandaloneAction = {
            hiveId: staged.hiveId,
            type: staged.action.type,
            details: details as CreateStandaloneAction['details'],
            notes: staged.action.notes,
            date: staged.date.toISOString(),
          };

          await createAction.mutateAsync(data);
          successCount++;
        } catch {
          failedActions.push(staged.hiveName);
        }
      }

      if (successCount === stagedActions.length) {
        toast.success(`Successfully created ${successCount} action(s)`);
        setStagedActions([]);
      } else {
        toast.error(
          `Created ${successCount} actions. Failed: ${failedActions.join(', ')}`,
        );
        // Remove successful actions
        setStagedActions(
          stagedActions.filter(a => failedActions.includes(a.hiveName)),
        );
      }
    } catch {
      toast.error('Failed to submit actions. Please try again.');
    }
  };

  const formatActionDetails = (action: ActionData) => {
    const details = [];

    switch (action.type) {
      case 'FEEDING': {
        const feeding = action as FeedingActionData;
        details.push(`${feeding.feedType?.replace('_', ' ')}`);
        details.push(`${feeding.quantity} ${feeding.unit}`);
        if (feeding.concentration) {
          details.push(`(${feeding.concentration})`);
        }
        break;
      }
      case 'TREATMENT': {
        const treatment = action as TreatmentActionData;
        details.push(treatment.treatmentType || '');
        details.push(`${treatment.amount} ${treatment.unit}`);
        break;
      }
      case 'FRAME': {
        const frame = action as FramesActionData;
        details.push(`${frame.frames} frames`);
        break;
      }
      case 'NOTE': {
        const note = action as NoteActionData;
        const content = note.notes || '';
        details.push(
          content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        );
        break;
      }
    }

    return details.filter(Boolean).join(' - ');
  };

  const renderEditForm = () => {
    if (!editingAction) return null;

    const action = editingAction.action;

    const handleEditRemove = () => {
      // Not needed for edit dialog
    };

    switch (action.type) {
      case 'FEEDING': {
        const feedingData = action as FeedingActionData;
        const feedingAction: FeedingActionType = {
          type: 'FEEDING',
          feedType: feedingData.feedType,
          quantity: feedingData.quantity,
          unit: feedingData.unit,
          concentration: feedingData.concentration,
          notes: feedingData.notes,
        };

        const handleFeedingSave = (updatedAction: FeedingActionType) => {
          const convertedAction: FeedingActionData = {
            type: ActionType.FEEDING,
            feedType: updatedAction.feedType,
            quantity: updatedAction.quantity,
            unit: updatedAction.unit,
            concentration: updatedAction.concentration,
            notes: updatedAction.notes,
          };
          editMethods.setValue('actions', [convertedAction]);
        };

        return (
          <FeedingForm
            action={feedingAction}
            onSave={handleFeedingSave}
            onRemove={handleEditRemove}
          />
        );
      }
      case 'TREATMENT': {
        const treatmentData = action as TreatmentActionData;
        const treatmentAction: TreatmentActionType = {
          type: 'TREATMENT',
          treatmentType: treatmentData.treatmentType,
          amount: treatmentData.amount,
          unit: treatmentData.unit,
          notes: treatmentData.notes,
        };

        const handleTreatmentSave = (updatedAction: TreatmentActionType) => {
          const convertedAction: TreatmentActionData = {
            type: ActionType.TREATMENT,
            treatmentType: updatedAction.treatmentType,
            amount: updatedAction.amount,
            unit: updatedAction.unit,
            notes: updatedAction.notes,
          };
          editMethods.setValue('actions', [convertedAction]);
        };

        return (
          <TreatmentForm
            action={treatmentAction}
            onSave={handleTreatmentSave}
            onRemove={handleEditRemove}
          />
        );
      }
      case 'FRAME': {
        const frameData = action as FramesActionData;
        const frameAction: FramesActionType = {
          type: 'FRAME',
          frames: frameData.frames,
          notes: frameData.notes,
        };

        const handleFrameSave = (updatedAction: FramesActionType) => {
          const convertedAction: FramesActionData = {
            type: ActionType.FRAME,
            frames: updatedAction.frames,
            notes: updatedAction.notes,
          };
          editMethods.setValue('actions', [convertedAction]);
        };

        return (
          <FramesForm
            action={frameAction}
            onSave={handleFrameSave}
            onRemove={handleEditRemove}
          />
        );
      }
      case 'NOTE': {
        const noteData = action as NoteActionData;
        // Pre-populate the form with existing note content
        editMethods.setValue('actions', [noteData]);

        const handleNoteSave = (updatedAction: NoteActionType) => {
          const convertedAction: NoteActionData = {
            type: ActionType.NOTE,
            notes: updatedAction.notes,
          };
          editMethods.setValue('actions', [convertedAction]);
        };

        return <NoteForm onSave={handleNoteSave} onRemove={handleEditRemove} />;
      }
      default:
        return null;
    }
  };

  if (hivesLoading) {
    return <div>Loading hives...</div>;
  }

  const currentActions = methods.watch('actions') || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bulk Actions</h1>
        {stagedActions.length > 0 && (
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {stagedActions.length} action(s) staged
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Builder */}
        <div className="space-y-6">
          <FormProvider {...methods}>
            <form onSubmit={e => e.preventDefault()}>
              {/* Date Selection */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Action Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !methods.watch('date') && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {methods.watch('date') ? (
                          format(methods.watch('date'), 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={methods.watch('date')}
                        onSelect={date =>
                          date && methods.setValue('date', date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>

              {/* Hive Selection */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Select Hives</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {hives.map(hive => (
                      <div
                        key={hive.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={hive.id}
                          checked={selectedHives.includes(hive.id)}
                          onCheckedChange={checked =>
                            handleHiveSelection(hive.id, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={hive.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {hive.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedHives.length > 0 && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      {selectedHives.length} hive(s) selected
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions Form */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Actions to Add</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActionsSection />
                </CardContent>
              </Card>

              {/* Add to Queue Button */}
              <Button
                onClick={handleAddToQueue}
                disabled={
                  selectedHives.length === 0 || currentActions.length === 0
                }
                className="w-full"
                data-umami-event="Bulk Action Queue"
                data-umami-event-hives={selectedHives.length.toString()}
                data-umami-event-actions={currentActions.length.toString()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to Queue ({selectedHives.length} hive
                {selectedHives.length !== 1 ? 's' : ''} ×{' '}
                {currentActions.length} action
                {currentActions.length !== 1 ? 's' : ''})
              </Button>
            </form>
          </FormProvider>
        </div>

        {/* Staged Actions */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Staged Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {stagedActions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No actions staged yet. Build your actions on the left and add
                  them to the queue.
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {stagedActions.map(staged => (
                    <div
                      key={staged.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{staged.hiveName}</span>
                          <Badge variant="outline" className="text-xs">
                            {staged.action.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatActionDetails(staged.action)}
                        </div>
                        {staged.action.notes && (
                          <div className="text-sm text-muted-foreground italic">
                            Note: {staged.action.notes}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {format(staged.date, 'PPP')}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditAction(staged)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveStagedAction(staged.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Actions */}
      {stagedActions.length > 0 && (
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setStagedActions([])}>
            Clear All
          </Button>
          <Button
            onClick={handleSubmitActions}
            disabled={createAction.isPending}
            data-umami-event="Bulk Action Submit"
            data-umami-event-count={stagedActions.length.toString()}
          >
            {createAction.isPending
              ? 'Submitting...'
              : `Submit ${stagedActions.length} Action(s)`}
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Action</DialogTitle>
          </DialogHeader>
          {editingAction && (
            <FormProvider {...editMethods}>
              <form onSubmit={e => e.preventDefault()}>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Hive</Label>
                      <Input value={editingAction.hiveName} disabled />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Input value={editingAction.action.type} disabled />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        value={format(editingAction.date, 'PPP')}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="mt-6">{renderEditForm()}</div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingAction(null);
                        setShowEditDialog(false);
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleSaveEdit}>
                      <Check className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </form>
            </FormProvider>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
