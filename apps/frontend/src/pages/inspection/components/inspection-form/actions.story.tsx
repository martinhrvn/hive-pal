import { FormProvider, useForm } from 'react-hook-form';
import { MemoryRouter } from 'react-router-dom';
import { ActionsSection } from './actions.tsx';

export const ActionsWithForm = () => {
  const form = useForm({
    defaultValues: { actions: [] },
  });
  // The treatment form links to the product catalog, so it needs a router.
  return (
    <MemoryRouter>
      <FormProvider {...form}>
        <form>
          <ActionsSection />
        </form>
      </FormProvider>
    </MemoryRouter>
  );
};
