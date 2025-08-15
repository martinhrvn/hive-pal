import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ActionsSection } from '@/pages/inspection/components/inspection-form/actions';
import { useCreateAction } from '@/api/hooks/useActions';
import { CreateStandaloneAction, ActionType } from 'shared-schemas';
import { toast } from 'sonner';
import { useForm, FormProvider } from 'react-hook-form';

interface AddActionDialogProps {
  hiveId: string;
}

interface ActionFormData {
  actions: Array<{
    type: ActionType;
    details: any;
    notes?: string;
  }>;
}

export const AddActionDialog = ({ hiveId }: AddActionDialogProps) => {
  const [open, setOpen] = useState(false);
  const createAction = useCreateAction();
  
  const methods = useForm<ActionFormData>({
    defaultValues: {
      actions: [],
    },
  });

  const handleSave = async () => {
    const values = methods.getValues();
    const actions = values.actions || [];
    
    if (actions.length === 0) {
      toast.error('Please add at least one action before saving.');
      return;
    }

    try {
      // Create each action individually
      for (const action of actions) {
        // Map the action data from the form to the API structure
        let details: any = {};
        
        if (action.type === 'FEEDING') {
          details = {
            type: 'FEEDING',
            feedType: (action as any).feedType,
            amount: (action as any).quantity,
            unit: (action as any).unit,
            concentration: (action as any).concentration,
          };
        } else if (action.type === 'TREATMENT') {
          details = {
            type: 'TREATMENT',
            product: (action as any).product,
            quantity: (action as any).quantity,
            unit: (action as any).unit,
            duration: (action as any).duration,
          };
        } else if (action.type === 'FRAME') {
          details = {
            type: 'FRAME',
            quantity: (action as any).quantity,
          };
        } else {
          details = {
            type: 'OTHER',
          };
        }
        
        const data: CreateStandaloneAction = {
          hiveId,
          type: action.type,
          details,
          notes: action.notes,
        };
        
        await createAction.mutateAsync(data);
      }

      toast.success(`Successfully saved ${actions.length} action(s).`);

      // Reset form and close dialog
      methods.reset();
      setOpen(false);
    } catch (error) {
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
          <form onSubmit={(e) => e.preventDefault()}>
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