import { forwardRef, useImperativeHandle } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { ActionsSection } from '@/pages/inspection/components/inspection-form/actions';
import type { ActionData } from '@/pages/inspection/components/inspection-form/schema';
import type { StagedItem } from './types';

interface ActionBuilderForm {
  actions: ActionData[];
}

export interface BuilderHandle {
  /** Build staged items for the given hives. Returns an empty array if the
   *  builder has no content to add (the shell will toast). */
  buildItems: (
    hives: { id: string; name: string }[],
    date: Date,
  ) => StagedItem[];
  reset: () => void;
  /** Used by the shell to label the "Add to Queue" button accurately. */
  itemCount: () => number;
}

export const ActionBuilder = forwardRef<BuilderHandle>((_, ref) => {
  const methods = useForm<ActionBuilderForm>({
    defaultValues: { actions: [] },
  });

  useImperativeHandle(ref, () => ({
    buildItems: (hives, date) => {
      const actions = methods.getValues('actions') || [];
      if (actions.length === 0) return [];
      const items: StagedItem[] = [];
      for (const hive of hives) {
        for (const action of actions) {
          items.push({
            kind: 'action',
            id: `${hive.id}-${action.type}-${Date.now()}-${Math.random()}`,
            hiveId: hive.id,
            hiveName: hive.name,
            date,
            action: { ...action },
          });
        }
      }
      return items;
    },
    reset: () => methods.reset({ actions: [] }),
    itemCount: () => (methods.watch('actions') || []).length,
  }));

  return (
    <FormProvider {...methods}>
      <form onSubmit={e => e.preventDefault()}>
        <ActionsSection disableBoxConfig />
      </form>
    </FormProvider>
  );
});

ActionBuilder.displayName = 'ActionBuilder';
