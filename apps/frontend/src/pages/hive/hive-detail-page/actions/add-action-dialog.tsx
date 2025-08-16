import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ActionsSection } from '@/pages/inspection/components/inspection-form/actions';
import { useCreateAction } from '@/api/hooks/useActions';
import { CreateStandaloneAction, ActionType } from 'shared-schemas';
import { toast } from 'sonner';
import { useForm, FormProvider } from 'react-hook-form';

interface AddActionDialogProps {
  hiveId: string;
}

interface ActionFormData {
  date: Date;
  actions: Array<{
    type: ActionType;
    details: Record<string, unknown>;
    notes?: string;
  }>;
}

export const AddActionDialog = ({ hiveId }: AddActionDialogProps) => {
  const [open, setOpen] = useState(false);
  const createAction = useCreateAction();

  const methods = useForm<ActionFormData>({
    defaultValues: {
      date: new Date(),
      actions: [],
    },
  });

  const handleSave = async () => {
    const values = methods.getValues();
    const actions = values.actions || [];
    const selectedDate = values.date;

    if (actions.length === 0) {
      toast.error('Please add at least one action before saving.');
      return;
    }

    try {
      // Create each action individually
      for (const action of actions) {
        // Map the action data from the form to the API structure
        let details: Record<string, unknown> = {};

        if (action.type === 'FEEDING') {
          // Feeding: quantity -> amount
          const feedingAction = action as {
            feedType: string;
            quantity: number;
            unit: string;
            concentration?: number;
          };
          details = {
            type: 'FEEDING',
            feedType: feedingAction.feedType,
            amount: feedingAction.quantity,
            unit: feedingAction.unit,
            concentration: feedingAction.concentration,
          };
        } else if (action.type === 'TREATMENT') {
          // Treatment: treatmentType -> product, amount -> quantity
          const treatmentAction = action as {
            treatmentType: string;
            amount: number;
            unit: string;
            duration?: number;
          };
          details = {
            type: 'TREATMENT',
            product: treatmentAction.treatmentType,
            quantity: treatmentAction.amount,
            unit: treatmentAction.unit,
            duration: treatmentAction.duration,
          };
        } else if (action.type === 'FRAME') {
          // Frame: frames -> quantity
          const frameAction = action as { frames: number };
          details = {
            type: 'FRAME',
            quantity: frameAction.frames,
          };
        } else {
          details = {
            type: 'OTHER',
          };
        }

        const data: CreateStandaloneAction = {
          hiveId,
          type: action.type,
          details: details as CreateStandaloneAction['details'],
          notes: action.notes,
          date: selectedDate.toISOString(),
        };

        await createAction.mutateAsync(data);
      }

      toast.success(`Successfully saved ${actions.length} action(s).`);

      // Reset form and close dialog
      methods.reset();
      setOpen(false);
    } catch {
      toast.error('There was an error saving the actions. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Action
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Actions</DialogTitle>
        </DialogHeader>
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
            <ActionsSection />
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  methods.reset();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={createAction.isPending}
              >
                {createAction.isPending ? 'Saving...' : 'Save Actions'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};
