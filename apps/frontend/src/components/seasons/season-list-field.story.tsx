import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { seasonListSchema, type Season } from 'shared-schemas';
import { Button } from '@/components/ui/button';
import { SeasonListField } from './season-list-field';

const schema = z.object({ seasons: seasonListSchema });

const Harness = ({ initialSeasons = [] }: { initialSeasons?: Season[] }) => {
  const [saved, setSaved] = useState('');
  const form = useForm<z.input<typeof schema>, unknown, z.infer<typeof schema>>(
    {
      resolver: zodResolver(schema),
      defaultValues: { seasons: initialSeasons },
    },
  );

  return (
    <FormProvider {...form}>
      <form
        className="max-w-2xl space-y-4 p-4"
        onSubmit={form.handleSubmit(data => {
          setSaved(JSON.stringify(data.seasons));
          // As the real forms do after a successful save.
          form.reset(data);
        })}
      >
        <SeasonListField baseFrequencyDays={7} />
        <Button type="submit">Save</Button>
        <pre data-test="saved">{saved}</pre>
      </form>
    </FormProvider>
  );
};

const SPRING: Season = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Spring',
  start: { month: 3, day: 1 },
  end: { month: 5, day: 31 },
  inspectionFrequencyDays: 5,
  feeding: { enabled: false, targetKg: null },
};

export const Default = () => <Harness />;

export const WithSeason = () => <Harness initialSeasons={[SPRING]} />;
