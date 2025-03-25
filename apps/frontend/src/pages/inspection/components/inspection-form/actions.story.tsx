import { FormProvider, useForm } from 'react-hook-form';
import { ActionsSection } from './actions.tsx';

export const ActionsWithForm = () => {
  const form = useForm({
    defaultValues: { actions: [] },
  });
  return (
    <FormProvider {...form}>
      <form>
        <ActionsSection />
      </form>
    </FormProvider>
  );
};
