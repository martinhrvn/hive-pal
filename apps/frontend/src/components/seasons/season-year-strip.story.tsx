import type { Season } from 'shared-schemas';
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
