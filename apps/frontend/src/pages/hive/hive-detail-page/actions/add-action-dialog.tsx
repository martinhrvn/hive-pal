import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ActionDateTimeField } from './action-date-time-field';
import { ActionsSection } from '@/pages/inspection/components/inspection-form/actions';
import { useCreateAction } from '@/api/hooks/useActions';
import { CreateStandaloneAction } from 'shared-schemas';
import { toast } from 'sonner';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import type {
  ActionData,
  FeedingActionData,
  TreatmentActionData,
  FramesActionData,
  MaintenanceActionData,
  NoteActionData,
} from '@/pages/inspection/components/inspection-form/schema';

interface AddActionDialogProps {
  hiveId: string;
  /** When provided, the dialog is controlled externally (no trigger rendered) */
  open?: boolean;
  /** Called when the dialog open state changes (controlled mode) */
  onOpenChange?: (open: boolean) => void;
}

interface ActionFormData {
  date: Date;
  actions: ActionData[];
}

// A fresh "now" each time, so a reopened dialog doesn't keep a stale time.
const emptyForm = (): ActionFormData => ({ date: new Date(), actions: [] });

export const AddActionDialog = ({
  hiveId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddActionDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;
  const { t } = useTranslation(['hive', 'common']);
  const createAction = useCreateAction();

  const methods = useForm<ActionFormData>({ defaultValues: emptyForm() });

  const close = () => {
    methods.reset(emptyForm());
    setOpen(false);
  };

  const handleSave = async () => {
    const values = methods.getValues();
    const actions = values.actions || [];
    const selectedDate = values.date;

    if (actions.length === 0) {
      toast.error(t('hive:actionDialog.noActions'));
      return;
    }

    try {
      const payloads = actions.map(action => {
        // Map the action data from the form to the API structure
        let details: Record<string, unknown>;

        if (action.type === 'FEEDING') {
          // Feeding: quantity -> amount
          const feedingAction = action as FeedingActionData;
          details = {
            type: 'FEEDING',
            feedType: feedingAction.feedType,
            amount: feedingAction.quantity,
            unit: feedingAction.unit,
            concentration: feedingAction.concentration,
            feedTypeId: feedingAction.feedTypeId,
            enteredAmount: feedingAction.enteredAmount,
            enteredUnit: feedingAction.enteredUnit,
            amountG: feedingAction.amountG,
            density: feedingAction.density,
            sugarContent: feedingAction.sugarContent,
            sugarG: feedingAction.sugarG,
            waterAddedMl: feedingAction.waterAddedMl,
          };
        } else if (action.type === 'TREATMENT') {
          // Treatment: treatmentType -> product, amount -> quantity
          const treatmentAction = action as TreatmentActionData;
          details = {
            type: 'TREATMENT',
            product: treatmentAction.treatmentType,
            quantity: treatmentAction.amount,
            unit: treatmentAction.unit,
          };
        } else if (action.type === 'FRAME') {
          // Frame: frames -> quantity
          const frameAction = action as FramesActionData;
          details = {
            type: 'FRAME',
            quantity: frameAction.frames,
          };
        } else if (action.type === 'MAINTENANCE') {
          const maintenanceAction = action as MaintenanceActionData;
          details = {
            type: 'MAINTENANCE',
            component: maintenanceAction.component,
            status: maintenanceAction.status,
          };
        } else if (action.type === 'NOTE') {
          // Note: store content in notes field
          const noteAction = action as NoteActionData;
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
          hiveId,
          type: action.type,
          details: details as CreateStandaloneAction['details'],
          notes: 'notes' in action ? action.notes : undefined,
          date: selectedDate.toISOString(),
        };

        return data;
      });

      // Actions are independent records, so create them in parallel.
      await Promise.all(payloads.map(data => createAction.mutateAsync(data)));

      toast.success(
        t('hive:actionDialog.createSuccess', { count: actions.length }),
      );
      close();
    } catch {
      toast.error(t('hive:actionDialog.createError'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t('hive:actionDialog.addTrigger')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('hive:actionDialog.addTitle')}</DialogTitle>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={e => e.preventDefault()}>
            <Controller
              name="date"
              control={methods.control}
              render={({ field }) => (
                <ActionDateTimeField
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <ActionsSection />
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={close}>
                {t('common:actions.cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={createAction.isPending}
              >
                {createAction.isPending
                  ? t('hive:actionDialog.saving')
                  : t('hive:actionDialog.saveActions')}
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};
