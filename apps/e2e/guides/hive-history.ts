import type { SmokeApi } from '../tests/smoke/fixtures';

/**
 * A season of history for one hive, so its detail page and Analytics tab
 * look lived in: a brood box with an excluder and two honey supers, eight
 * inspections over the last five months (a swarm-cell scare in early
 * summer, a honey flow, then winding down), and two autumn syrup feedings.
 * The last visit is ten days ago, past the default seven-day frequency, so
 * the hive has an "inspection overdue" alert.
 */
export async function seedHiveHistory(api: SmokeApi, hiveId: string) {
  const sizes = await api.listFrameSizes();
  const sizeId = (name: string) =>
    sizes.find(s => s.isBuiltIn && s.name === name)?.id ?? null;
  const deep = sizeId('Langstroth Deep');
  const medium = sizeId('Langstroth Medium');

  await api.setBoxes(hiveId, [
    box(0, 'BROOD', 'LANGSTROTH_DEEP', deep, 10, '#3b82f6'),
    {
      ...box(1, 'HONEY', 'LANGSTROTH_MEDIUM', medium, 10, '#f59e0b'),
      hasExcluder: true,
    },
    box(2, 'HONEY', 'LANGSTROTH_MEDIUM', medium, 6, '#f59e0b'),
  ]);

  for (const v of VISITS) {
    await api.createInspection({
      hiveId,
      date: daysAgo(v.daysAgo),
      temperature: v.temperature,
      weatherConditions: v.weather,
      observations: v.observations,
      actions: v.feedLitres
        ? [
            {
              type: 'FEEDING',
              details: {
                type: 'FEEDING',
                feedType: 'SYRUP',
                amount: v.feedLitres,
                unit: 'L',
                concentration: '2:1',
              },
            },
          ]
        : undefined,
    });
  }

  // Each inspection re-checks the hive's alerts in the background, and those
  // checks can finish out of order, leaving an alert about an older visit.
  // A settings update runs one more check against the latest inspection.
  await new Promise(resolve => setTimeout(resolve, 1000));
  await api.updateHive(hiveId, {
    settings: { inspection: { frequencyDays: 7 } },
  });
}

function box(
  position: number,
  type: 'BROOD' | 'HONEY',
  variant: string,
  frameSizeId: string | null,
  frameCount: number,
  color: string,
) {
  return {
    position,
    type,
    variant,
    frameSizeId,
    frameCount,
    maxFrameCount: 10,
    hasExcluder: false,
    winterized: false,
    color,
  };
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(10, 0, 0, 0);
  return d.toISOString();
}

type Visit = {
  daysAgo: number;
  temperature: number;
  weather: string;
  observations: Record<string, unknown>;
  feedLitres?: number;
};

/** Frame counts across the brood box and supers, oldest visit first. */
const frames = (
  eggs: number,
  uncapped: number,
  capped: number,
  drone: number,
  pollen: number,
  nectar: number,
  honey: number,
  empty: number,
) => ({
  totalFrames:
    eggs + uncapped + capped + drone + pollen + nectar + honey + empty,
  eggsFrames: eggs,
  uncappedBroodFrames: uncapped,
  cappedBroodFrames: capped,
  droneBroodFrames: drone,
  pollenFrames: pollen,
  nectarFrames: nectar,
  honeyFrames: honey,
  emptyFrames: empty,
});

const VISITS: Visit[] = [
  {
    daysAgo: 150,
    temperature: 19,
    weather: 'sunny',
    observations: {
      ...frames(2, 3, 3, 1, 1, 2, 1, 1),
      strength: 6,
      queenSeen: true,
    },
  },
  {
    daysAgo: 128,
    temperature: 24,
    weather: 'sunny',
    observations: {
      ...frames(3, 4, 4, 2, 2, 3, 2, 0),
      strength: 8,
      queenCells: 5,
      swarmCells: true,
      queenSeen: false,
    },
  },
  {
    daysAgo: 106,
    temperature: 27,
    weather: 'partly-cloudy',
    observations: {
      ...frames(2, 3, 4, 1, 2, 4, 5, 1),
      strength: 9,
      queenCells: 0,
      queenSeen: true,
    },
  },
  {
    daysAgo: 85,
    temperature: 29,
    weather: 'sunny',
    observations: {
      ...frames(2, 3, 4, 1, 2, 4, 8, 0),
      strength: 9,
      queenSeen: true,
    },
  },
  {
    daysAgo: 64,
    temperature: 25,
    weather: 'sunny',
    observations: {
      ...frames(2, 3, 3, 0, 2, 2, 6, 2),
      strength: 8,
      queenSeen: true,
    },
  },
  {
    daysAgo: 45,
    temperature: 21,
    weather: 'cloudy',
    observations: {
      ...frames(1, 2, 3, 0, 3, 2, 6, 3),
      strength: 7,
      queenSeen: true,
    },
  },
  {
    daysAgo: 24,
    temperature: 16,
    weather: 'partly-cloudy',
    observations: {
      ...frames(1, 1, 2, 0, 2, 2, 7, 5),
      strength: 6,
      queenSeen: true,
    },
    feedLitres: 5,
  },
  {
    daysAgo: 10,
    temperature: 12,
    weather: 'cloudy',
    observations: {
      ...frames(0, 1, 2, 0, 2, 1, 7, 7),
      strength: 6,
      queenSeen: false,
    },
    feedLitres: 4,
  },
];
