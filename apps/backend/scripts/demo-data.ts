/**
 * Demo dataset for preview deployments and local development: two apiaries,
 * six hives with boxes and queens, a season of inspections, feedings,
 * treatments and a harvest. Dates are relative to `now`, so the data always
 * looks recent.
 *
 * Every row is built in memory with its own id and written with `createMany`
 * in one transaction, so a failure leaves nothing half-seeded.
 */
import { randomUUID } from 'crypto';
import {
  calculateScores,
  feedAmountToGrams,
  feedSugarGrams,
  getBuiltinFeedType,
  type ObservationSchemaType,
} from 'shared-schemas';
import type { Prisma, PrismaClient } from '../src/generated/prisma/client.js';

const DAY = 24 * 60 * 60 * 1000;
const INSPECTION_INTERVAL_DAYS = 12;
const SEASON_DAYS = 150;

/** Small deterministic PRNG so the dataset is the same on every seed. */
const createRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
};

// International marking colours by the last digit of the year
const MARKING_COLORS = ['blue', 'white', 'yellow', 'red', 'green'];
const markingColor = (year: number) => MARKING_COLORS[year % 5];

type HiveSpec = {
  name: string;
  apiary: 'home' | 'outyard';
  row: number;
  col: number;
  /** Colony strength 0–1; drives observations, boxes and harvest share. */
  vigor: number;
  queenYear: number;
  dead?: boolean;
};

const HIVES: HiveSpec[] = [
  {
    name: 'Hive 01',
    apiary: 'home',
    row: 0,
    col: 0,
    vigor: 0.9,
    queenYear: -1,
  },
  { name: 'Hive 02', apiary: 'home', row: 0, col: 1, vigor: 0.7, queenYear: 0 },
  {
    name: 'Hive 03',
    apiary: 'home',
    row: 0,
    col: 2,
    vigor: 0.5,
    queenYear: -2,
  },
  { name: 'Hive 04', apiary: 'home', row: 1, col: 0, vigor: 0.8, queenYear: 0 },
  {
    name: 'Orchard 1',
    apiary: 'outyard',
    row: 0,
    col: 0,
    vigor: 0.6,
    queenYear: -1,
  },
  {
    name: 'Orchard 2',
    apiary: 'outyard',
    row: 0,
    col: 1,
    vigor: 0,
    queenYear: -3,
    dead: true,
  },
];

const clampFrames = (value: number) =>
  Math.max(0, Math.min(10, Math.round(value)));

/** Observation rows exactly as InspectionsService stores them. */
const observationRows = (
  inspectionId: string,
  o: ObservationSchemaType,
): Prisma.ObservationCreateManyInput[] =>
  [
    { type: 'strength', numericValue: o.strength },
    { type: 'capped_brood', numericValue: o.cappedBrood },
    { type: 'uncapped_brood', numericValue: o.uncappedBrood },
    { type: 'honey_stores', numericValue: o.honeyStores },
    { type: 'pollen_stores', numericValue: o.pollenStores },
    { type: 'queen_cells', numericValue: o.queenCells },
    { type: 'swarm_cells', booleanValue: o.swarmCells },
    { type: 'queen_seen', booleanValue: o.queenSeen },
    { type: 'brood_pattern', textValue: o.broodPattern },
    ...(o.additionalObservations ?? []).map((tag) => ({
      type: `additional_${tag}`,
      booleanValue: true,
    })),
    ...(o.reminderObservations ?? []).map((tag) => ({
      type: `reminder_${tag}`,
      booleanValue: true,
    })),
  ].map((row) => ({ id: randomUUID(), inspectionId, ...row }));

/** A plausible inspection for a colony at `progress` (0–1) through the season. */
const buildObservations = (
  vigor: number,
  progress: number,
  random: () => number,
): ObservationSchemaType => {
  // Brood peaks mid-season, stores build up towards the end
  const broodCurve = Math.sin(Math.PI * Math.min(1, progress + 0.15));
  const brood = 2 + 7 * vigor * broodCurve + (random() - 0.5) * 2;
  const stores = 2 + 7 * vigor * progress + (random() - 0.5) * 2;
  const swarmy = vigor > 0.75 && progress > 0.25 && progress < 0.45;

  return {
    strength: clampFrames(3 + 7 * vigor * broodCurve),
    cappedBrood: clampFrames(brood),
    uncappedBrood: clampFrames(brood - 1),
    honeyStores: clampFrames(stores),
    pollenStores: clampFrames(3 + 4 * broodCurve + (random() - 0.5) * 2),
    queenCells: swarmy ? 3 : 0,
    swarmCells: swarmy,
    queenSeen: random() > 0.35,
    broodPattern: vigor >= 0.7 ? 'solid' : vigor >= 0.5 ? 'spotty' : 'patchy',
    additionalObservations: vigor >= 0.7 ? ['calm', 'healthy'] : ['nervous'],
    reminderObservations: [
      ...(swarmy ? (['overcrowded', 'needs_super'] as const) : []),
      ...(progress > 0.85 ? (['prepare_for_winter'] as const) : []),
    ],
  };
};

export async function seedDemoData(
  prisma: PrismaClient,
  userId: string,
  now = new Date(),
): Promise<{ hives: number; inspections: number }> {
  const daysAgo = (days: number) => new Date(now.getTime() - days * DAY);
  const thisYear = now.getFullYear();
  const random = createRandom(42);

  // Reuse the default apiary created at sign-up, if it is still empty
  const defaultApiary = await prisma.apiary.findFirst({
    where: { userId, hives: { none: {} } },
    orderBy: { name: 'asc' },
  });
  const apiaryIds = {
    home: defaultApiary?.id ?? randomUUID(),
    outyard: randomUUID(),
  };
  const apiaries: Prisma.ApiaryCreateManyInput[] = [
    ...(defaultApiary
      ? []
      : [
          {
            id: apiaryIds.home,
            name: 'Home Apiary',
            userId,
            settings: { inspectionType: 'data_driven' },
          },
        ]),
    {
      id: apiaryIds.outyard,
      name: 'Orchard Outyard',
      location: 'Old orchard behind the village',
      userId,
      settings: { inspectionType: 'data_driven' },
    },
  ];

  const hives: Prisma.HiveCreateManyInput[] = [];
  const boxes: Prisma.BoxCreateManyInput[] = [];
  const queens: Prisma.QueenCreateManyInput[] = [];
  const movements: Prisma.QueenMovementCreateManyInput[] = [];
  const inspections: Prisma.InspectionCreateManyInput[] = [];
  const observations: Prisma.ObservationCreateManyInput[] = [];
  const notes: Prisma.InspectionNoteCreateManyInput[] = [];
  const actions: Prisma.ActionCreateManyInput[] = [];
  const feedings: Prisma.FeedingActionCreateManyInput[] = [];
  const treatments: Prisma.TreatmentActionCreateManyInput[] = [];

  const oxalic = await prisma.treatmentProduct.findFirst({
    where: { name: 'Oxalic Acid', isBuiltIn: true },
    select: { id: true },
  });
  const syrup = getBuiltinFeedType('SYRUP_2_1')!;

  const liveHives: { id: string; vigor: number }[] = [];

  for (const spec of HIVES) {
    const hiveId = randomUUID();
    const installed = daysAgo(SEASON_DAYS + 200);
    hives.push({
      id: hiveId,
      name: spec.name,
      apiaryId: apiaryIds[spec.apiary],
      status: spec.dead ? 'DEAD' : 'ACTIVE',
      installationDate: installed,
      positionRow: spec.row,
      positionCol: spec.col,
      notes: spec.dead ? 'Lost over winter, varroa suspected.' : null,
    });

    // Two brood boxes, plus a super above an excluder for strong colonies
    const boxCount = spec.vigor >= 0.7 ? 3 : 2;
    for (let position = 0; position < boxCount; position++) {
      const isSuper = position === 2;
      boxes.push({
        id: randomUUID(),
        hiveId,
        position,
        type: isSuper ? 'HONEY' : 'BROOD',
        variant: isSuper ? 'LANGSTROTH_MEDIUM' : 'LANGSTROTH_DEEP',
        frameCount: 10,
        maxFrameCount: 10,
        // Excluder on top of the brood nest, under the super
        hasExcluder: boxCount === 3 && position === 1,
        addedAt: isSuper ? daysAgo(SEASON_DAYS * 0.4) : installed,
      });
    }

    const queenYear = thisYear + spec.queenYear;
    const queenId = randomUUID();
    const queenInstalled = spec.queenYear === 0 ? daysAgo(70) : installed;
    queens.push({
      id: queenId,
      hiveId,
      year: queenYear,
      color: markingColor(queenYear),
      marking: 'Dot',
      source: spec.queenYear === 0 ? 'Own rearing' : 'Local breeder',
      status: spec.dead ? 'DEAD' : 'ACTIVE',
      installedAt: queenInstalled,
    });
    movements.push({
      id: randomUUID(),
      queenId,
      toHiveId: hiveId,
      movedAt: queenInstalled,
      reason: 'Initial installation',
    });

    // This year's queens replaced an older one: keep it in the history
    if (spec.queenYear === 0) {
      const oldQueenId = randomUUID();
      queens.push({
        id: oldQueenId,
        hiveId,
        year: thisYear - 3,
        color: markingColor(thisYear - 3),
        source: 'Package',
        status: 'REPLACED',
        installedAt: installed,
        replacedAt: queenInstalled,
      });
      movements.push({
        id: randomUUID(),
        queenId: oldQueenId,
        toHiveId: hiveId,
        movedAt: installed,
        reason: 'Initial installation',
      });
    }

    if (spec.dead) continue;
    liveHives.push({ id: hiveId, vigor: spec.vigor });

    for (let day = SEASON_DAYS; day > 0; day -= INSPECTION_INTERVAL_DAYS) {
      const inspectionId = randomUUID();
      const progress = 1 - day / SEASON_DAYS;
      const observed = buildObservations(spec.vigor, progress, random);
      const score = calculateScores(observed);
      inspections.push({
        id: inspectionId,
        hiveId,
        date: daysAgo(day),
        status: 'COMPLETED',
        temperature: Math.round(14 + 10 * Math.sin(Math.PI * progress)),
        weatherConditions: random() > 0.3 ? 'sunny' : 'cloudy',
        createdByUserId: userId,
        overallScore: score.overallScore,
        populationScore: score.populationScore,
        storesScore: score.storesScore,
        queenScore: score.queenScore,
        scoreWarnings: JSON.stringify(score.warnings),
        scoreConfidence: score.confidence,
      });
      observations.push(...observationRows(inspectionId, observed));
      if (observed.swarmCells) {
        notes.push({
          id: randomUUID(),
          inspectionId,
          text: 'Swarm cells on the bottom bars. Added a super and broke down the cells.',
        });
      }
    }

    // Next visit, so the calendar and dashboard have something upcoming
    inspections.push({
      id: randomUUID(),
      hiveId,
      date: daysAgo(-3 - liveHives.length),
      status: 'SCHEDULED',
      createdByUserId: userId,
    });

    // Autumn feeding: 2:1 syrup in two rounds
    for (const day of [20, 8]) {
      const actionId = randomUUID();
      const enteredAmount = spec.vigor >= 0.7 ? 5 : 8;
      const amountG = feedAmountToGrams(enteredAmount, 'l', syrup.density)!;
      actions.push({
        id: actionId,
        hiveId,
        type: 'FEEDING',
        date: daysAgo(day),
        createdByUserId: userId,
      });
      feedings.push({
        id: randomUUID(),
        actionId,
        feedType: syrup.label,
        amount: enteredAmount,
        unit: 'l',
        concentration: '2:1',
        feedTypeId: syrup.id,
        enteredAmount,
        enteredUnit: 'l',
        amountG,
        density: syrup.density,
        sugarContent: syrup.sugarContent,
        sugarG: feedSugarGrams(amountG, syrup.sugarContent),
      });
    }

    // Summer varroa treatment with a mite count
    const treatmentId = randomUUID();
    actions.push({
      id: treatmentId,
      hiveId,
      type: 'TREATMENT',
      date: daysAgo(35),
      notes: 'After the last honey harvest',
      createdByUserId: userId,
    });
    treatments.push({
      id: randomUUID(),
      actionId: treatmentId,
      product: 'Oxalic Acid',
      productId: oxalic?.id ?? null,
      quantity: 2,
      unit: 'g',
      miteCountMethod: 'ALCOHOL_WASH',
      miteCountBefore: Math.round(4 + (1 - spec.vigor) * 10),
      miteSampleSize: 300,
    });
  }

  // One finished honey harvest from the home apiary
  const harvestId = randomUUID();
  const homeHives = liveHives.filter((hive) =>
    hives.some((h) => h.id === hive.id && h.apiaryId === apiaryIds.home),
  );
  const totalVigor = homeHives.reduce((sum, hive) => sum + hive.vigor, 0);
  const totalWeight = 62;
  const harvest: Prisma.HarvestCreateManyInput = {
    id: harvestId,
    apiaryId: apiaryIds.home,
    date: daysAgo(40),
    status: 'COMPLETED',
    totalWeight,
    totalWeightUnit: 'kg',
    notes: 'Summer harvest, mostly linden.',
  };
  const harvestHives: Prisma.HarvestHiveCreateManyInput[] = homeHives.map(
    (hive) => {
      const share = hive.vigor / totalVigor;
      return {
        id: randomUUID(),
        harvestId,
        hiveId: hive.id,
        framesTaken: Math.round(12 * share * homeHives.length) || 1,
        honeyAmount: Math.round(totalWeight * share * 10) / 10,
        honeyAmountUnit: 'kg',
        honeyPercentage: Math.round(share * 1000) / 10,
      };
    },
  );

  await prisma.$transaction([
    prisma.apiary.createMany({ data: apiaries }),
    prisma.hive.createMany({ data: hives }),
    prisma.box.createMany({ data: boxes }),
    prisma.queen.createMany({ data: queens }),
    prisma.queenMovement.createMany({ data: movements }),
    prisma.inspection.createMany({ data: inspections }),
    prisma.observation.createMany({ data: observations }),
    prisma.inspectionNote.createMany({ data: notes }),
    prisma.action.createMany({ data: actions }),
    prisma.feedingAction.createMany({ data: feedings }),
    prisma.treatmentAction.createMany({ data: treatments }),
    prisma.harvest.createMany({ data: [harvest] }),
    prisma.harvestHive.createMany({ data: harvestHives }),
  ]);

  return { hives: hives.length, inspections: inspections.length };
}
