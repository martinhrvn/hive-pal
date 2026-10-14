import { useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { parseISO } from 'date-fns';
import { ActionDateTimeField } from './action-date-time-field';
import { Link } from 'react-router-dom';
import { ActionsSection } from '@/pages/inspection/components/inspection-form/actions';
import { useUpdateAction } from '@/api/hooks/useActions';
import { ActionResponse, ActionType, UpdateAction } from 'shared-schemas';
import { toast } from 'sonner';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type {
  ActionData,
  FeedingActionData,
  TreatmentActionData,
  FramesActionData,
  MaintenanceActionData,
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
  /** Only edited for splits, whose details are immutable. */
  notes: string;
}

const toFormValues = (action: ActionResponse): ActionFormData => ({
  date: parseISO(action.date),
  actions: [convertResponseToFormData(action)],
  notes: action.notes ?? '',
});

interface ActionWarning {
  message: string;
  linkTo?: string;
  linkText?: string;
}

const getWarning = (
  action: ActionResponse,
  t: TFunction,
): ActionWarning | null => {
  if (action.inspectionId) {
    return {
      message: t('hive:actionDialog.warnings.inspection'),
      linkTo: `/inspections/${action.inspectionId}`,
      linkText: t('hive:actionDialog.warnings.inspectionLink'),
    };
  }
  if (action.type === ActionType.HARVEST || action.harvestId) {
    return {
      message: t('hive:actionDialog.warnings.harvest'),
      linkTo: action.harvestId ? `/harvests/${action.harvestId}` : '/harvests',
      linkText: t('hive:actionDialog.warnings.harvestLink'),
    };
  }
  if (action.type === ActionType.SPLIT) {
    return { message: t('hive:actionDialog.warnings.split') };
  }
  return null;
};

// Convert API ActionResponse to form ActionData
const convertResponseToFormData = (action: ActionResponse): ActionData => {
  switch (action.details.type) {
    case ActionType.FEEDING:
      return {
        type: ActionType.FEEDING,
        feedType: action.details.feedType,
        quantity: action.details.amount,
        unit: action.details.unit,
        concentration: action.details.concentration,
        notes: action.notes,
        feedTypeId: action.details.feedTypeId,
        enteredAmount: action.details.enteredAmount,
        enteredUnit: action.details.enteredUnit,
        amountG: action.details.amountG,
        density: action.details.density,
        sugarContent: action.details.sugarContent,
        sugarG: action.details.sugarG,
        waterAddedMl: action.details.waterAddedMl,
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

    case ActionType.MAINTENANCE:
      return {
        type: ActionType.MAINTENANCE,
        component: action.details.component,
        status: action.details.status,
        notes: action.notes,
      } as MaintenanceActionData;

    case ActionType.NOTE:
      return {
        type: ActionType.NOTE,
        notes: action.details.content || action.notes || '',
      } as NoteActionData;

    case ActionType.HARVEST:
      // Harvest actions are displayed but we'll show them as OTHER for editing
      return {
        type: ActionType.OTHER,
        notes:
          action.notes ||
          `Harvest: ${action.details.amount} ${action.details.unit}`,
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
      feedTypeId: feedingAction.feedTypeId,
      enteredAmount: feedingAction.enteredAmount,
      enteredUnit: feedingAction.enteredUnit,
      amountG: feedingAction.amountG,
      density: feedingAction.density,
      sugarContent: feedingAction.sugarContent,
      sugarG: feedingAction.sugarG,
      waterAddedMl: feedingAction.waterAddedMl,
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
  } else if (formAction.type === ActionType.MAINTENANCE) {
    const maintenanceAction = formAction as MaintenanceActionData;
    details = {
      type: ActionType.MAINTENANCE,
      component: maintenanceAction.component as
        'BOX' | 'BOTTOM_BOARD' | 'COVER',
      status: maintenanceAction.status as 'REPLACED' | 'CLEANED',
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
    notes: 'notes' in formAction ? formAction.notes : undefined,
    date: date.toISOString(),
  };
};

export const EditActionDialog = ({
  action,
  open,
  onOpenChange,
}: EditActionDialogProps) => {
  const { t } = useTranslation(['hive', 'common']);
  const notesId = useId();
  const updateAction = useUpdateAction();
  // A split is a structural paired record: only date + notes are editable.
  const isSplit = action.type === ActionType.SPLIT;

  const methods = useForm<ActionFormData>({
    defaultValues: toFormValues(action),
  });

  // Reset form when action changes
  useEffect(() => {
    methods.reset(toFormValues(action));
  }, [action, methods]);

  const handleSave = async () => {
    const values = methods.getValues();
    const actions = values.actions || [];
    const selectedDate = values.date;

    if (isSplit) {
      // Split details are immutable; only date + notes travel to the server.
      try {
        await updateAction.mutateAsync({
          actionId: action.id,
          data: {
            date: selectedDate.toISOString(),
            notes: values.notes.trim() || undefined,
          },
        });
        toast.success(t('hive:actionDialog.splitUpdateSuccess'));
        onOpenChange(false);
      } catch {
        toast.error(t('hive:actionDialog.updateError'));
      }
      return;
    }

    if (actions.length === 0) {
      toast.error(t('hive:actionDialog.noActions'));
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

      toast.success(t('hive:actionDialog.updateSuccess'));
      onOpenChange(false);
    } catch {
      toast.error(t('hive:actionDialog.updateError'));
    }
  };

  const warning = getWarning(action, t);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('hive:actionDialog.editTitle')}</DialogTitle>
        </DialogHeader>

        {warning && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              {warning.message}
              {warning.linkTo && (
                <>
                  {' '}
                  <Link
                    to={warning.linkTo}
                    className="underline font-medium hover:text-amber-900"
                  >
                    {warning.linkText}
                  </Link>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

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
            {isSplit ? (
              <div className="mb-4">
                <Label htmlFor={notesId} className="mb-2">
                  {t('hive:actionDialog.notes')}
                </Label>
                <Textarea
                  id={notesId}
                  {...methods.register('notes')}
                  placeholder={t('hive:actionDialog.splitNotesPlaceholder')}
                  rows={3}
                />
              </div>
            ) : (
              <ActionsSection editMode />
            )}
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common:actions.cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={updateAction.isPending}
              >
                {updateAction.isPending
                  ? t('hive:actionDialog.saving')
                  : t('hive:actionDialog.saveChanges')}
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};
