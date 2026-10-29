import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { seasonListSchema, type Season } from 'shared-schemas';
import { Button } from '@/components/ui/button';
import { SeasonListField } from './season-list-field';
import { SeasonsEditorProvider } from './season-editor-provider';

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
        <SeasonsEditorProvider>
          <SeasonListField baseFrequencyDays={7} />
        </SeasonsEditorProvider>
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

const SUMMER: Season = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Summer',
  start: { month: 6, day: 1 },
  end: { month: 8, day: 31 },
  inspectionFrequencyDays: 10,
  feeding: { enabled: false, targetKg: null },
};

/** Spring runs straight into summer. */
export const WithNeighbours = () => (
  <Harness initialSeasons={[SPRING, SUMMER]} />
);

/** An unnamed season that shares the end of May with spring. */
export const Overlapping = () => (
  <Harness
    initialSeasons={[
      SPRING,
      {
        ...SUMMER,
        name: '',
        start: { month: 5, day: 15 },
        end: { month: 7, day: 31 },
      },
    ]}
  />
);
