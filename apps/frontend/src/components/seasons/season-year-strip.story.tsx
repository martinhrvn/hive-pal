import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { seasonListSchema, type Season } from 'shared-schemas';
import { SeasonsEditorProvider } from './season-editor-provider';
import { SeasonListField } from './season-list-field';
import { SeasonYearStrip } from './season-year-strip';

const SPRING: Season = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Spring build-up',
  start: { month: 3, day: 1 },
  end: { month: 5, day: 31 },
  inspectionFrequencyDays: 5,
  feeding: { enabled: false, targetKg: null },
};

const AUTUMN: Season = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Winter prep',
  start: { month: 8, day: 1 },
  end: { month: 10, day: 31 },
  inspectionFrequencyDays: null,
  feeding: { enabled: true, targetKg: 12 },
};

const WINTER: Season = {
  id: '44444444-4444-4444-8444-444444444444',
  name: 'Winter',
  start: { month: 11, day: 15 },
  end: { month: 2, day: 15 },
  inspectionFrequencyDays: 30,
  feeding: { enabled: false, targetKg: null },
};

const TODAY = new Date(2026, 3, 15);

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-3xl p-4">{children}</div>
);

export const Default = () => (
  <Frame>
    <SeasonYearStrip
      seasons={[SPRING, AUTUMN, WINTER]}
      baseFrequencyDays={10}
      today={TODAY}
    />
  </Frame>
);

export const NoSeasons = () => (
  <Frame>
    <SeasonYearStrip seasons={[]} baseFrequencyDays={7} today={TODAY} />
  </Frame>
);

/** An apiary without a year-round interval: each hive keeps its own. */
export const NoYearRoundInterval = () => (
  <Frame>
    <SeasonYearStrip seasons={[AUTUMN]} today={TODAY} />
  </Frame>
);

const schema = z.object({ seasons: seasonListSchema });

const EditableHarness = ({
  initialSeasons = [],
}: {
  initialSeasons?: Season[];
}) => {
  const form = useForm<z.input<typeof schema>, unknown, z.infer<typeof schema>>(
    {
      resolver: zodResolver(schema),
      defaultValues: { seasons: initialSeasons },
    },
  );

  return (
    <FormProvider {...form}>
      <SeasonsEditorProvider>
        <div className="max-w-3xl space-y-6 p-4">
          <SeasonYearStrip
            seasons={(form.watch('seasons') ?? []) as Season[]}
            baseFrequencyDays={7}
            today={TODAY}
          />
          <SeasonListField baseFrequencyDays={7} />
        </div>
      </SeasonsEditorProvider>
    </FormProvider>
  );
};

/** Strip + list wired together: click a season to edit, a gap to add. */
export const Editable = () => (
  <EditableHarness initialSeasons={[SPRING, AUTUMN, WINTER]} />
);

const EARLY_AUTUMN: Season = {
  ...AUTUMN,
  end: { month: 9, day: 30 },
};

/** Spring and autumn only: the winter gap spans the new year. */
export const EditableWinterGap = () => (
  <EditableHarness initialSeasons={[SPRING, EARLY_AUTUMN]} />
);

const CLOSED_WINTER: Season = {
  ...WINTER,
  inspectionFrequencyDays: null,
  inspectionsPaused: true,
};

/** Every role at once: inspect, feeding, paused and year-round days. */
export const AllRoles = () => (
  <Frame>
    <SeasonYearStrip
      seasons={[SPRING, AUTUMN, CLOSED_WINTER]}
      baseFrequencyDays={10}
      today={TODAY}
    />
  </Frame>
);

/** The editable strip with every role, as the apiary seasons page shows it. */
export const EditableAllRoles = () => (
  <EditableHarness initialSeasons={[SPRING, AUTUMN, CLOSED_WINTER]} />
);
