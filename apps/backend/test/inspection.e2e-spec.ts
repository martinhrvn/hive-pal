import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { setupApiary, setupApp, setupHive, setupUser } from './fixtures/setup';
import {
  ActionType,
  Box,
  BoxTypeEnum,
  BoxVariantEnum,
  CreateAction,
  CreateInspection,
} from 'shared-schemas';
import { getRandomApiary } from './fixtures/apiary';
import { getRandomHive } from './fixtures/hive';

let app: INestApplication;
let prisma: PrismaService;
let authCookie: string[];
let userId: string;
let apiaryId: string;
let testHiveId: string;
const cleanupHiveIds = new Set<string>();

beforeAll(async () => {
  ({ app, prisma } = await setupApp());
  ({ userId, authCookie } = await setupUser(app));
  apiaryId = await setupApiary(app, userId);
  testHiveId = await setupHive(app, apiaryId);
  cleanupHiveIds.add(testHiveId);
});

afterAll(async () => {
  // Clean up test data
  // Delete in the correct order to avoid foreign key constraints
  const hiveIds = [...cleanupHiveIds];
  await prisma.observation.deleteMany({
    where: { inspection: { hiveId: { in: hiveIds } } },
  });
  await prisma.inspectionNote.deleteMany({
    where: { inspection: { hiveId: { in: hiveIds } } },
  });
  await prisma.frameAction.deleteMany({
    where: { action: { inspection: { hiveId: { in: hiveIds } } } },
  });
  await prisma.feedingAction.deleteMany({
    where: { action: { inspection: { hiveId: { in: hiveIds } } } },
  });
  await prisma.treatmentAction.deleteMany({
    where: { action: { inspection: { hiveId: { in: hiveIds } } } },
  });
  await prisma.boxConfigurationAction.deleteMany({
    where: { action: { inspection: { hiveId: { in: hiveIds } } } },
  });
  await prisma.action.deleteMany({
    where: { inspection: { hiveId: { in: hiveIds } } },
  });
  await prisma.inspection.deleteMany({
    where: { hiveId: { in: hiveIds } },
  });
  await prisma.box.deleteMany({
    where: { hiveId: { in: hiveIds } },
  });
  await prisma.hive.deleteMany({
    where: { id: { in: hiveIds } },
  });
  await prisma.apiary.deleteMany({
    where: { userId },
  });
  await app.close();
});

it('should create a minimal inspection', async () => {
  const req: CreateInspection = {
    date: new Date().toISOString(),
    hiveId: testHiveId,
    notes: 'This is a test inspection',
    temperature: 14.5,
    weatherConditions: 'sunny',
  };
  const response = await request(app.getHttpServer())
    .post('/inspections')
    .set('Cookie', authCookie)
    .set('x-apiary-id', apiaryId) // Set the apiary context
    .send(req)
    .expect(201);

  // Check response
  expect(response.body).toHaveProperty('id');
  expect(response.body).toEqual({
    date: req.date,
    hiveId: testHiveId,
    id: expect.any(String),
    status: 'COMPLETED',
  });

  const inspection = await prisma.inspection.findUnique({
    where: { id: response.body.id },
  });

  expect(inspection).toBeDefined();
  if (inspection) {
    expect(inspection.date.toISOString()).toBe(req.date);
    expect(inspection.temperature).toBe(14.5);
    expect(inspection.status).toBe('COMPLETED');
    expect(inspection.hiveId).toBe(testHiveId);
  }
});

it('should create an inspection with observations', async () => {
  const req: CreateInspection = {
    date: new Date().toISOString(),
    hiveId: testHiveId,
    notes: 'Inspection with observations',
    temperature: 18.5,
    weatherConditions: 'partly cloudy',
    observations: {
      strength: 4,
      cappedBrood: 3,
      uncappedBrood: 2,
      honeyStores: 5,
      pollenStores: 4,
      queenSeen: true,
      queenCells: 0,
      swarmCells: false,
      supersedureCells: false,
    },
  };

  // Create the inspection
  const createResponse = await request(app.getHttpServer())
    .post('/inspections')
    .set('Cookie', authCookie)
    .set('x-apiary-id', apiaryId)
    .send(req)
    .expect(201);

  expect(createResponse.body).toHaveProperty('id');
  const inspectionId = createResponse.body.id;

  // Fetch the inspection to verify observations
  const getResponse = await request(app.getHttpServer())
    .get(`/inspections/${inspectionId}`)
    .set('Cookie', authCookie)
    .set('x-apiary-id', apiaryId)
    .expect(200);

  // Verify basic inspection properties
  expect(getResponse.body).toMatchObject({
    id: inspectionId,
    date: req.date,
    hiveId: testHiveId,
    status: 'COMPLETED',
    temperature: 18.5,
    weatherConditions: 'partly cloudy',
    notes: 'Inspection with observations',
  });

  // Verify observations in the response
  expect(getResponse.body).toHaveProperty('observations');
  expect(getResponse.body.observations).toEqual({
    strength: 4,
    cappedBrood: 3,
    uncappedBrood: 2,
    honeyStores: 5,
    pollenStores: 4,
    queenSeen: true,
    queenCells: 0,
    swarmCells: false,
    supersedureCells: false,
    broodPattern: null,
    cappedBroodFrames: null,
    droneBroodFrames: null,
    eggsFrames: null,
    emptyFrames: null,
    honeyFrames: null,
    nectarFrames: null,
    pollenFrames: null,
    totalFrames: null,
    uncappedBroodFrames: null,
  });

  // Verify scoring was calculated
  expect(getResponse.body).toHaveProperty('score');
  expect(getResponse.body.score).toEqual({
    confidence: 1,
    overallScore: 4.46,
    populationScore: 3.25,
    queenScore: 6.67,
    storesScore: 4.67,
    warnings: [],
  });
});

it('should not return or persist scores for subjective apiaries', async () => {
  const subjectiveApiary = await prisma.apiary.create({
    data: getRandomApiary({
      userId,
      settings: { inspectionType: 'subjective' },
    }),
  });
  const subjectiveHive = await prisma.hive.create({
    data: getRandomHive({ apiaryId: subjectiveApiary.id }),
  });
  cleanupHiveIds.add(subjectiveHive.id);

  const req: CreateInspection = {
    date: new Date().toISOString(),
    hiveId: subjectiveHive.id,
    observations: {
      strength: 7,
      cappedBrood: 6,
      uncappedBrood: 4,
      honeyStores: 5,
      pollenStores: 3,
      queenSeen: true,
    },
  };

  const createResponse = await request(app.getHttpServer())
    .post('/inspections')
    .set('Cookie', authCookie)
    .set('x-apiary-id', subjectiveApiary.id)
    .send(req)
    .expect(201);

  const storedInspection = await prisma.inspection.findUnique({
    where: { id: createResponse.body.id },
  });

  expect(storedInspection?.overallScore).toBeNull();
  expect(storedInspection?.populationScore).toBeNull();
  expect(storedInspection?.storesScore).toBeNull();
  expect(storedInspection?.queenScore).toBeNull();
  expect(storedInspection?.scoreWarnings).toBeNull();
  expect(storedInspection?.scoreConfidence).toBeNull();

  const getResponse = await request(app.getHttpServer())
    .get(`/inspections/${createResponse.body.id}`)
    .set('Cookie', authCookie)
    .set('x-apiary-id', subjectiveApiary.id)
    .expect(200);

  expect(getResponse.body.score).toBeUndefined();
});

describe('Create status', () => {
  const getReq = (date = new Date()) => ({
    date: date.toISOString(),
    hiveId: testHiveId,
    notes: 'Inspection with observations',
    temperature: 18.5,
    weatherConditions: 'partly cloudy',
  });

  console.log('Hive id: ', testHiveId);
  it('should set default status for creating inspection with past date', async () => {
    // Create the inspection
    const createResponse = await request(app.getHttpServer())
      .post('/inspections')
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .send(getReq());

    console.log(createResponse.body);
    expect(createResponse.body).toHaveProperty('id');
    const inspectionId = createResponse.body.id;

    // Fetch the inspection to verify observations
    const getResponse = await request(app.getHttpServer())
      .get(`/inspections/${inspectionId}`)
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .expect(200);

    // Verify basic inspection properties
    expect(getResponse.body.status).toEqual('COMPLETED');
  });

  it('should set status to PENDING for future date', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/inspections')
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .send(getReq(new Date(Date.now() + 1000 * 60 * 60 * 24))) // Future date
      .expect(201);

    expect(createResponse.body).toHaveProperty('id');
    const inspectionId = createResponse.body.id;
    // Fetch the inspection to verify observations
    const getResponse = await request(app.getHttpServer())
      .get(`/inspections/${inspectionId}`)
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .expect(200);

    // Verify basic inspection properties
    expect(getResponse.body.status).toEqual('SCHEDULED');
  });

  it('should set manual status', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/inspections')
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .send({ ...getReq(), status: 'CANCELLED' }) // Future date
      .expect(201);

    expect(createResponse.body).toHaveProperty('id');
    const inspectionId = createResponse.body.id;
    const getResponse = await request(app.getHttpServer())
      .get(`/inspections/${inspectionId}`)
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .expect(200);

    // Verify basic inspection properties
    expect(getResponse.body.status).toEqual('CANCELLED');
  });
});

it('should create an inspection with FEEDING action', async () => {
  const req: CreateInspection = {
    date: new Date().toISOString(),
    hiveId: testHiveId,
    notes: 'Inspection with feeding action',
    temperature: 16.5,
    weatherConditions: 'clear',
    actions: [
      {
        type: ActionType.FEEDING,
        notes: 'Fall feeding',
        details: {
          type: ActionType.FEEDING,
          feedType: 'Sugar Syrup',
          amount: 2.5,
          unit: 'liters',
          concentration: '2:1',
        },
      },
    ],
  };

  // Create the inspection
  const createResponse = await request(app.getHttpServer())
    .post('/inspections')
    .set('Cookie', authCookie)
    .set('x-apiary-id', apiaryId)
    .send(req)
    .expect(201);

  expect(createResponse.body).toHaveProperty('id');
  const inspectionId = createResponse.body.id;

  // Verify the database records
  const actions = await prisma.action.findMany({
    where: { inspectionId },
    include: { feedingAction: true },
  });

  expect(actions).toHaveLength(1);
  expect(actions[0]).toMatchObject({
    type: 'FEEDING',
    notes: 'Fall feeding',
  });
  expect(actions[0].feedingAction).toBeDefined();
  expect(actions[0].feedingAction).toMatchObject({
    feedType: 'Sugar Syrup',
    amount: 2.5,
    unit: 'liters',
    concentration: '2:1',
  });

  // Fetch the inspection to verify the action in the response
  const getResponse = await request(app.getHttpServer())
    .get(`/inspections/${inspectionId}`)
    .set('Cookie', authCookie)
    .set('x-apiary-id', apiaryId)
    .expect(200);

  // Verify actions in the response
  expect(getResponse.body).toHaveProperty('actions');
  expect(getResponse.body.actions).toHaveLength(1);
  expect(getResponse.body.actions[0]).toMatchObject({
    type: 'FEEDING',
    notes: 'Fall feeding',
    details: {
      feedType: 'Sugar Syrup',
      amount: 2.5,
      unit: 'liters',
      concentration: '2:1',
    },
  });
});

it('should create an inspection with TREATMENT action', async () => {
  const req: CreateInspection = {
    date: new Date().toISOString(),
    hiveId: testHiveId,
    notes: 'Inspection with treatment action',
    temperature: 17.5,
    weatherConditions: 'cloudy',
    actions: [
      {
        type: ActionType.TREATMENT,
        notes: 'Mite treatment',
        details: {
          type: ActionType.TREATMENT,
          product: 'Apivar',
          quantity: 2,
          unit: 'strips',
          duration: '42 days',
        },
      },
    ],
  };

  // Create the inspection
  const createResponse = await request(app.getHttpServer())
    .post('/inspections')
    .set('Cookie', authCookie)
    .set('x-apiary-id', apiaryId)
    .send(req)
    .expect(201);

  expect(createResponse.body).toHaveProperty('id');
  const inspectionId = createResponse.body.id;

  // Verify the database records
  const actions = await prisma.action.findMany({
    where: { inspectionId },
    include: { treatmentAction: true },
  });

  expect(actions).toHaveLength(1);
  expect(actions[0]).toMatchObject({
    type: 'TREATMENT',
    notes: 'Mite treatment',
  });
  expect(actions[0].treatmentAction).toBeDefined();
  expect(actions[0].treatmentAction).toMatchObject({
    product: 'Apivar',
    quantity: 2,
    unit: 'strips',
    duration: '42 days',
  });

  // Fetch the inspection to verify the action in the response
  const getResponse = await request(app.getHttpServer())
    .get(`/inspections/${inspectionId}`)
    .set('Cookie', authCookie)
    .set('x-apiary-id', apiaryId)
    .expect(200);

  // Verify actions in the response
  expect(getResponse.body).toHaveProperty('actions');
  expect(getResponse.body.actions).toHaveLength(1);
  expect(getResponse.body.actions[0]).toMatchObject({
    type: 'TREATMENT',
    notes: 'Mite treatment',
    details: {
      product: 'Apivar',
      quantity: 2,
      unit: 'strips',
      duration: '42 days',
    },
  });
});

it('should create an inspection with FRAME action', async () => {
  const req: CreateInspection = {
    date: new Date().toISOString(),
    hiveId: testHiveId,
    notes: 'Inspection with frame action',
    temperature: 19.0,
    weatherConditions: 'sunny',
    actions: [
      {
        type: ActionType.FRAME,
        notes: 'Added frames for honey flow',
        details: {
          type: ActionType.FRAME,
          quantity: 3,
        },
      },
    ],
  };

  // Create the inspection
  const createResponse = await request(app.getHttpServer())
    .post('/inspections')
    .set('Cookie', authCookie)
    .set('x-apiary-id', apiaryId)
    .send(req)
    .expect(201);

  expect(createResponse.body).toHaveProperty('id');
  const inspectionId = createResponse.body.id;

  // Verify the database records
  const actions = await prisma.action.findMany({
    where: { inspectionId },
    include: { frameAction: true },
  });

  expect(actions).toHaveLength(1);
  expect(actions[0]).toMatchObject({
    type: 'FRAME',
    notes: 'Added frames for honey flow',
  });
  expect(actions[0].frameAction).toBeDefined();
  expect(actions[0].frameAction).toMatchObject({
    quantity: 3,
  });

  // Fetch the inspection to verify the action in the response
  const getResponse = await request(app.getHttpServer())
    .get(`/inspections/${inspectionId}`)
    .set('Cookie', authCookie)
    .set('x-apiary-id', apiaryId)
    .expect(200);

  // Verify actions in the response
  expect(getResponse.body).toHaveProperty('actions');
  expect(getResponse.body.actions).toHaveLength(1);
  expect(getResponse.body.actions[0]).toMatchObject({
    type: 'FRAME',
    notes: 'Added frames for honey flow',
    details: {
      quantity: 3,
    },
  });
});

it('should create an inspection with OTHER action', async () => {
  const req: CreateInspection = {
    date: new Date().toISOString(),
    hiveId: testHiveId,
    notes: 'Inspection with other action',
    temperature: 20.0,
    weatherConditions: 'sunny',
    actions: [
      {
        type: ActionType.OTHER,
        notes: 'Cleaned bottom board',
        details: {
          type: ActionType.OTHER,
        },
      },
    ],
  };

  // Create the inspection
  const createResponse = await request(app.getHttpServer())
    .post('/inspections')
    .set('Cookie', authCookie)
    .set('x-apiary-id', apiaryId)
    .send(req)
    .expect(201);

  expect(createResponse.body).toHaveProperty('id');
  const inspectionId = createResponse.body.id;

  // Verify the database records
  const actions = await prisma.action.findMany({
    where: { inspectionId },
  });

  expect(actions).toHaveLength(1);
  expect(actions[0]).toMatchObject({
    type: 'OTHER',
    notes: 'Cleaned bottom board',
  });

  // Fetch the inspection to verify the action in the response
  const getResponse = await request(app.getHttpServer())
    .get(`/inspections/${inspectionId}`)
    .set('Cookie', authCookie)
    .set('x-apiary-id', apiaryId)
    .expect(200);

  // Verify actions in the response
  expect(getResponse.body).toHaveProperty('actions');
  expect(getResponse.body.actions).toHaveLength(1);
  expect(getResponse.body.actions[0]).toMatchObject({
    type: 'OTHER',
    notes: 'Cleaned bottom board',
  });
});

it('should create an inspection with multiple actions of different types', async () => {
  const req: CreateInspection = {
    date: new Date().toISOString(),
    hiveId: testHiveId,
    notes: 'Inspection with multiple actions',
    temperature: 21.0,
    weatherConditions: 'partly cloudy',
    actions: [
      {
        type: ActionType.FEEDING,
        notes: 'Spring feeding',
        details: {
          type: ActionType.FEEDING,
          feedType: 'Pollen Sub',
          amount: 0.5,
          unit: 'kg',
        },
      },
      {
        type: ActionType.FRAME,
        notes: 'Removed old frames',
        details: {
          type: ActionType.FRAME,
          quantity: -2,
        },
      },
      {
        type: ActionType.OTHER,
        notes: 'Replaced hive stand',
        details: {
          type: ActionType.OTHER,
        },
      },
    ],
  };

  // Create the inspection
  const createResponse = await request(app.getHttpServer())
    .post('/inspections')
    .set('Cookie', authCookie)
    .set('x-apiary-id', apiaryId)
    .send(req)
    .expect(201);

  expect(createResponse.body).toHaveProperty('id');
  const inspectionId = createResponse.body.id;

  // Verify the database records
  const actions = await prisma.action.findMany({
    where: { inspectionId },
    include: { feedingAction: true, frameAction: true, treatmentAction: true },
    orderBy: { type: 'asc' }, // Order by type to make assertions easier
  });

  expect(actions).toHaveLength(3);

  // Check FEEDING action
  const feedingAction = actions.find((a) => a.type === 'FEEDING');
  expect(feedingAction).toBeDefined();
  if (feedingAction) {
    expect(feedingAction).toMatchObject({
      type: 'FEEDING',
      notes: 'Spring feeding',
    });
    expect(feedingAction.feedingAction).toBeDefined();
    expect(feedingAction.feedingAction).toMatchObject({
      feedType: 'Pollen Sub',
      amount: 0.5,
      unit: 'kg',
    });
  }

  // Check FRAME action
  const frameAction = actions.find((a) => a.type === 'FRAME');
  expect(frameAction).toBeDefined();
  if (frameAction) {
    expect(frameAction).toMatchObject({
      type: 'FRAME',
      notes: 'Removed old frames',
    });
    expect(frameAction.frameAction).toBeDefined();
    expect(frameAction.frameAction).toMatchObject({
      quantity: -2,
    });
  }

  // Check OTHER action
  const otherAction = actions.find((a) => a.type === 'OTHER');
  expect(otherAction).toBeDefined();
  if (otherAction) {
    expect(otherAction).toMatchObject({
      type: 'OTHER',
      notes: 'Replaced hive stand',
    });
  }

  // Fetch the inspection to verify the actions in the response
  const getResponse = await request(app.getHttpServer())
    .get(`/inspections/${inspectionId}`)
    .set('Cookie', authCookie)
    .set('x-apiary-id', apiaryId)
    .expect(200);

  // Verify actions in the response
  expect(getResponse.body).toHaveProperty('actions');
  expect(getResponse.body.actions).toHaveLength(3);

  // Find each action by type in the response
  const respFeedingAction = getResponse.body.actions.find(
    (a) => a.type === 'FEEDING',
  );
  expect(respFeedingAction).toBeDefined();
  expect(respFeedingAction).toMatchObject({
    type: 'FEEDING',
    notes: 'Spring feeding',
    details: {
      feedType: 'Pollen Sub',
      amount: 0.5,
      unit: 'kg',
    },
  });

  const respFrameAction = getResponse.body.actions.find(
    (a) => a.type === 'FRAME',
  );
  expect(respFrameAction).toBeDefined();
  expect(respFrameAction).toMatchObject({
    type: 'FRAME',
    notes: 'Removed old frames',
    details: {
      quantity: -2,
    },
  });

  const respOtherAction = getResponse.body.actions.find(
    (a) => a.type === 'OTHER',
  );
  expect(respOtherAction).toBeDefined();
  expect(respOtherAction).toMatchObject({
    type: 'OTHER',
    notes: 'Replaced hive stand',
  });
});

describe('Box configuration recorded during an inspection', () => {
  const inspectionDate = '2026-05-01T10:00:00.000Z';
  const broodBox = {
    position: 0,
    frameCount: 10,
    maxFrameCount: 10,
    hasExcluder: false,
    type: BoxTypeEnum.BROOD,
    variant: BoxVariantEnum.LANGSTROTH_DEEP,
    color: '#3b82f6',
    winterized: false,
  };
  // The hive after the inspection: a honey super with an excluder added.
  const layoutWithSuper: Box[] = [
    broodBox,
    {
      position: 1,
      frameCount: 9,
      maxFrameCount: 10,
      hasExcluder: true,
      type: BoxTypeEnum.HONEY,
      variant: BoxVariantEnum.LANGSTROTH_MEDIUM,
      winterized: false,
    },
  ];

  // Counts are sent as zeros on purpose: the backend derives them itself.
  const boxConfigurationAction = (layout?: Box[]): CreateAction => ({
    type: ActionType.BOX_CONFIGURATION,
    details: {
      type: ActionType.BOX_CONFIGURATION,
      boxesAdded: 0,
      boxesRemoved: 0,
      framesAdded: 0,
      framesRemoved: 0,
      totalBoxes: 0,
      totalFrames: 0,
      layout,
    },
  });

  const createHiveWithBroodBox = async () => {
    const hiveId = await setupHive(app, apiaryId);
    cleanupHiveIds.add(hiveId);
    await prisma.box.create({ data: { hiveId, ...broodBox } });
    return hiveId;
  };

  const createInspection = async (hiveId: string, actions: CreateAction[]) => {
    const response = await request(app.getHttpServer())
      .post('/inspections')
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .send({
        date: inspectionDate,
        hiveId,
        actions,
      } satisfies CreateInspection)
      .expect(201);
    return response.body.id as string;
  };

  const updateActions = (inspectionId: string, actions: CreateAction[]) =>
    request(app.getHttpServer())
      .patch(`/inspections/${inspectionId}`)
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .send({ actions })
      .expect(200);

  const deleteInspection = (inspectionId: string, revertHiveChanges: boolean) =>
    request(app.getHttpServer())
      .delete(`/inspections/${inspectionId}`)
      .query(revertHiveChanges ? { revertHiveChanges: 'true' } : {})
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .expect(200);

  const hiveBoxes = (hiveId: string) =>
    prisma.box.findMany({ where: { hiveId }, orderBy: { position: 'asc' } });

  const boxActions = (hiveId: string) =>
    prisma.action.findMany({
      where: { hiveId, type: 'BOX_CONFIGURATION' },
      include: { boxConfigurationAction: true },
    });

  it('applies the layout with the inspection and records one action', async () => {
    const hiveId = await createHiveWithBroodBox();
    const inspectionId = await createInspection(hiveId, [
      boxConfigurationAction(layoutWithSuper),
    ]);

    const boxes = await hiveBoxes(hiveId);
    expect(boxes).toHaveLength(2);
    expect(boxes[1]).toMatchObject({
      type: 'HONEY',
      frameCount: 9,
      hasExcluder: true,
    });

    // Exactly one record: linked to the inspection and dated with it.
    const actions = await boxActions(hiveId);
    expect(actions).toHaveLength(1);
    expect(actions[0].inspectionId).toBe(inspectionId);
    expect(actions[0].date.toISOString()).toBe(inspectionDate);
    expect(actions[0].boxConfigurationAction).toMatchObject({
      boxesAdded: 1,
      boxesRemoved: 0,
      framesAdded: 9,
      framesRemoved: 0,
      totalBoxes: 2,
      totalFrames: 19,
    });

    const response = await request(app.getHttpServer())
      .get(`/inspections/${inspectionId}`)
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .expect(200);
    const details = response.body.actions[0].details;
    expect(details.boxes).toEqual([
      { type: 'BROOD', frameCount: 10 },
      { type: 'HONEY', frameCount: 9 },
    ]);
    expect(details.appliedLayout).toHaveLength(2);
  });

  it('undoes the box change when deleted with revertHiveChanges', async () => {
    const hiveId = await createHiveWithBroodBox();
    const inspectionId = await createInspection(hiveId, [
      boxConfigurationAction(layoutWithSuper),
    ]);

    await deleteInspection(inspectionId, true);

    const boxes = await hiveBoxes(hiveId);
    expect(boxes).toHaveLength(1);
    expect(boxes[0]).toMatchObject({ type: 'BROOD', frameCount: 10 });
  });

  it('keeps the boxes when deleted without reverting', async () => {
    const hiveId = await createHiveWithBroodBox();
    const inspectionId = await createInspection(hiveId, [
      boxConfigurationAction(layoutWithSuper),
    ]);

    await deleteInspection(inspectionId, false);

    expect(await hiveBoxes(hiveId)).toHaveLength(2);
  });

  it('does not undo the box change once the hive has changed since', async () => {
    const hiveId = await createHiveWithBroodBox();
    const inspectionId = await createInspection(hiveId, [
      boxConfigurationAction(layoutWithSuper),
    ]);
    // Something else changes the boxes after the inspection.
    await prisma.box.updateMany({
      where: { hiveId, position: 1 },
      data: { frameCount: 10 },
    });

    await deleteInspection(inspectionId, true);

    const boxes = await hiveBoxes(hiveId);
    expect(boxes).toHaveLength(2);
    expect(boxes[1].frameCount).toBe(10);
  });

  it('undoes frame changes recorded on top of the layout', async () => {
    const hiveId = await createHiveWithBroodBox();
    const inspectionId = await createInspection(hiveId, [
      boxConfigurationAction(layoutWithSuper),
      {
        type: ActionType.FRAME,
        details: { type: ActionType.FRAME, quantity: -2 },
      },
    ]);
    expect((await hiveBoxes(hiveId))[0].frameCount).toBe(8);

    await deleteInspection(inspectionId, true);

    const boxes = await hiveBoxes(hiveId);
    expect(boxes).toHaveLength(1);
    expect(boxes[0].frameCount).toBe(10);
  });

  it('keeps the saved box change when the inspection is re-saved', async () => {
    const hiveId = await createHiveWithBroodBox();
    const inspectionId = await createInspection(hiveId, [
      boxConfigurationAction(layoutWithSuper),
    ]);

    // The edit form sends the saved action back without a layout.
    await updateActions(inspectionId, [boxConfigurationAction()]);

    expect(await hiveBoxes(hiveId)).toHaveLength(2);
    const actions = await boxActions(hiveId);
    expect(actions).toHaveLength(1);
    expect(actions[0].boxConfigurationAction).toMatchObject({
      boxesAdded: 1,
      totalBoxes: 2,
    });

    // The undo data survived the re-save.
    await deleteInspection(inspectionId, true);
    expect(await hiveBoxes(hiveId)).toHaveLength(1);
  });

  it('keeps the hive as is when the box action is removed on edit', async () => {
    const hiveId = await createHiveWithBroodBox();
    const inspectionId = await createInspection(hiveId, [
      boxConfigurationAction(layoutWithSuper),
    ]);

    await updateActions(inspectionId, []);

    expect(await hiveBoxes(hiveId)).toHaveLength(2);
    expect(await boxActions(hiveId)).toHaveLength(0);
  });

  it('rejects a layout with incompatible box variants', async () => {
    const hiveId = await createHiveWithBroodBox();
    await request(app.getHttpServer())
      .post('/inspections')
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .send({
        date: inspectionDate,
        hiveId,
        actions: [
          boxConfigurationAction([
            broodBox,
            { ...layoutWithSuper[1], variant: BoxVariantEnum.DADANT },
          ]),
        ],
      })
      .expect(400);

    // Nothing was written: the inspection rolled back with the boxes.
    expect(await hiveBoxes(hiveId)).toHaveLength(1);
    expect(await prisma.inspection.count({ where: { hiveId } })).toBe(0);
  });
});
