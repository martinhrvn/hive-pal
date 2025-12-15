import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { ActionsSection } from '@/pages/inspection/components/inspection-form/actions';
import { useUpdateAction } from '@/api/hooks/useActions';
import { ActionResponse, ActionType, UpdateAction } from 'shared-schemas';
import { toast } from 'sonner';
import { useForm, FormProvider } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type {
  ActionData,
  FeedingActionData,
  TreatmentActionData,
  FramesActionData,
  NoteActionData,
} from '@/pages/inspection/components/inspection-form/schema';

interface EditActionDialogProps {
  action: ActionResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ActionFormData {
  date: Date;
  actions: ActionData[];
}

// Convert API ActionResponse to form ActionData
const convertResponseToFormData = (action: ActionResponse): ActionData => {
  switch (action.details.type) {
    case ActionType.FEEDING:
      return {
        type: ActionType.FEEDING,
        feedType: action.details.feedType as 'SYRUP' | 'HONEY' | 'CANDY',
        quantity: action.details.amount,
        unit: action.details.unit,
        concentration: action.details.concentration,
        notes: action.notes,
      } as FeedingActionData;

    case ActionType.TREATMENT:
      return {
        type: ActionType.TREATMENT,
        treatmentType: action.details.product,
        amount: action.details.quantity,
        unit: action.details.unit,
        notes: action.notes,
      } as TreatmentActionData;

    case ActionType.FRAME:
      return {
        type: ActionType.FRAME,
        frames: action.details.quantity,
        notes: action.notes,
      } as FramesActionData;

    case ActionType.NOTE:
      return {
        type: ActionType.NOTE,
        notes: action.details.content || action.notes || '',
      } as NoteActionData;

    case ActionType.HARVEST:
      // Harvest actions are displayed but we'll show them as OTHER for editing
      return {
        type: ActionType.OTHER,
        notes: action.notes || `Harvest: ${action.details.amount} ${action.details.unit}`,
      };

    default:
      return {
        type: ActionType.OTHER,
        notes: action.notes || '',
      };
  }
};

// Convert form ActionData to API UpdateAction format
const convertFormDataToUpdate = (
  formAction: ActionData,
  date: Date,
): UpdateAction => {
  let details: UpdateAction['details'];

  if (formAction.type === ActionType.FEEDING) {
    const feedingAction = formAction as FeedingActionData;
    details = {
      type: ActionType.FEEDING,
      feedType: feedingAction.feedType,
      amount: feedingAction.quantity,
      unit: feedingAction.unit,
      concentration: feedingAction.concentration,
    };
  } else if (formAction.type === ActionType.TREATMENT) {
    const treatmentAction = formAction as TreatmentActionData;
    details = {
      type: ActionType.TREATMENT,
      product: treatmentAction.treatmentType,
      quantity: treatmentAction.amount,
      unit: treatmentAction.unit,
    };
  } else if (formAction.type === ActionType.FRAME) {
    const frameAction = formAction as FramesActionData;
    details = {
      type: ActionType.FRAME,
      quantity: frameAction.frames,
    };
  } else if (formAction.type === ActionType.NOTE) {
    const noteAction = formAction as NoteActionData;
    details = {
      type: ActionType.NOTE,
      content: noteAction.notes,
    };
  } else {
    details = {
      type: ActionType.OTHER,
    };
  }

  return {
    type: formAction.type,
    details,
    notes: formAction.notes,
    date: date.toISOString(),
  };
};

export const EditActionDialog = ({
  action,
  open,
  onOpenChange,
}: EditActionDialogProps) => {
  const updateAction = useUpdateAction();

  const methods = useForm<ActionFormData>({
    defaultValues: {
      date: parseISO(action.date),
      actions: [convertResponseToFormData(action)],
    },
  });

  // Reset form when action changes
  useEffect(() => {
    methods.reset({
      date: parseISO(action.date),
      actions: [convertResponseToFormData(action)],
    });
  }, [action, methods]);

  const getWarning = (): { message: string; linkTo?: string; linkText?: string } | null => {
    if (action.inspectionId) {
      return {
        message: 'This action is part of an inspection. Editing it here will cause it to be out of sync with the inspection record.',
        linkTo: `/inspections/${action.inspectionId}`,
        linkText: 'Edit inspection instead',
      };
    }
    if (action.type === ActionType.HARVEST || action.harvestId) {
      return {
        message: 'This action is linked to a harvest. Editing it here will cause it to be out of sync with the harvest record.',
        linkTo: action.harvestId ? `/harvests/${action.harvestId}` : '/harvests',
        linkText: 'Go to harvest',
      };
    }
    return null;
  };

  const handleSave = async () => {
    const values = methods.getValues();
    const actions = values.actions || [];
    const selectedDate = values.date;

    if (actions.length === 0) {
      toast.error('Please add at least one action before saving.');
      return;
    }

    try {
      // We only edit one action at a time
      const formAction = actions[0];
      const updateData = convertFormDataToUpdate(formAction, selectedDate);

      await updateAction.mutateAsync({
        actionId: action.id,
        data: updateData,
      });

      toast.success('Action updated successfully');
      onOpenChange(false);
    } catch {
      toast.error('Failed to update action. Please try again.');
    }
  };

  const warning = getWarning();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Action</DialogTitle>
        </DialogHeader>

        {warning && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              {warning.message}
              {warning.linkTo && (
                <>
                  {' '}
                  <Link to={warning.linkTo} className="underline font-medium hover:text-amber-900">
                    {warning.linkText}
                  </Link>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <FormProvider {...methods}>
          <form onSubmit={e => e.preventDefault()}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Action Date
              </label>
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
                    onSelect={date => date && methods.setValue('date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <ActionsSection editMode />
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={updateAction.isPending}
              >
                {updateAction.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};
