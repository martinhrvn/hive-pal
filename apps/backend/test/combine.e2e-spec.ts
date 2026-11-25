import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { getRandomApiary } from './fixtures/apiary';
import { createTestUser, loginAndGetCookie } from './helpers/auth';

/**
 * Colony combine (uniting two colonies): archives the absorbed hive, keeps one
 * queen, optionally stacks boxes, and writes a COMBINE action pair.
 */
describe('Colony combine (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authCookie: string[];
  let userId: string;
  let apiaryId: string;
  let otherUserId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);

    const testUser = await createTestUser(prisma, {
      email: 'combine-test-user@example.com',
      password: 'password123',
    });
    userId = testUser.id;
    authCookie = await loginAndGetCookie(
      app,
      'combine-test-user@example.com',
      'password123',
    );

    const apiary = await prisma.apiary.create({
      data: getRandomApiary({ userId, name: 'Combine Test Apiary' }),
    });
    apiaryId = apiary.id;

    const otherUser = await createTestUser(prisma, {
      email: 'combine-other-user@example.com',
      password: 'password123',
    });
    otherUserId = otherUser.id;
  });

  afterAll(async () => {
    const owners = { in: [userId, otherUserId] };
    await prisma.combineAction.deleteMany({
      where: { action: { hive: { apiary: { userId: owners } } } },
    });
    await prisma.statusChangeAction.deleteMany({
      where: { action: { hive: { apiary: { userId: owners } } } },
    });
    await prisma.action.deleteMany({
      where: { hive: { apiary: { userId: owners } } },
    });
    await prisma.queenMovement.deleteMany({
      where: { queen: { hive: { apiary: { userId: owners } } } },
    });
    await prisma.queen.deleteMany({
      where: { hive: { apiary: { userId: owners } } },
    });
    await prisma.box.deleteMany({
      where: { hive: { apiary: { userId: owners } } },
    });
    await prisma.hive.deleteMany({ where: { apiary: { userId: owners } } });
    await prisma.apiary.deleteMany({ where: { userId: owners } });
    await prisma.user.deleteMany({ where: { id: owners } });
    await app.close();
  });

  // A hive with `boxCount` brood boxes and, optionally, an active queen.
  async function makeHive(
    name: string,
    opts: { boxCount?: number; queen?: boolean; inApiary?: string } = {},
  ) {
    const { boxCount = 1, queen = true, inApiary = apiaryId } = opts;
    const hive = await prisma.hive.create({
      data: { name, apiaryId: inApiary, status: 'ACTIVE' },
    });
    const boxes = await Promise.all(
      Array.from({ length: boxCount }, (_, position) =>
        prisma.box.create({
          data: {
            hiveId: hive.id,
            position,
            frameCount: 10,
            maxFrameCount: 10,
            hasExcluder: false,
            type: 'BROOD',
          },
        }),
      ),
    );
    const q = queen
      ? await prisma.queen.create({
          data: { hiveId: hive.id, status: 'ACTIVE' },
        })
      : null;
    return { hive, boxes, queen: q };
  }

  const combine = (survivorId: string, body: Record<string, unknown>) =>
    request(app.getHttpServer())
      .post(`/hives/${survivorId}/combine`)
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .send({ date: new Date().toISOString(), ...body });

  it('combines two hives: archives the absorbed one, stacks boxes, retires the other queen and writes a COMBINE pair', async () => {
    const a = await makeHive('Survivor A', { boxCount: 2 });
    const b = await makeHive('Absorbed A', { boxCount: 1 });

    const res = await combine(a.hive.id, {
      absorbedHiveId: b.hive.id,
      keptQueenId: a.queen!.id,
    }).expect(201);

    expect(res.body).toMatchObject({
      survivorHiveId: a.hive.id,
      absorbedHiveId: b.hive.id,
    });

    const absorbed = await prisma.hive.findUniqueOrThrow({
      where: { id: b.hive.id },
    });
    expect(absorbed.status).toBe('ARCHIVED');

    // The absorbed box sits on top of the survivor's two boxes.
    const movedBox = await prisma.box.findUniqueOrThrow({
      where: { id: b.boxes[0].id },
    });
    expect(movedBox.hiveId).toBe(a.hive.id);
    expect(movedBox.position).toBe(2);

    // Default fate of the other queen is DEAD; she stays in the absorbed hive.
    const otherQueen = await prisma.queen.findUniqueOrThrow({
      where: { id: b.queen!.id },
    });
    expect(otherQueen.status).toBe('DEAD');
    expect(otherQueen.hiveId).toBe(b.hive.id);
    const keptQueen = await prisma.queen.findUniqueOrThrow({
      where: { id: a.queen!.id },
    });
    expect(keptQueen.status).toBe('ACTIVE');

    const pair = await prisma.combineAction.findMany({
      where: { combineId: res.body.combineId },
      include: { action: true },
    });
    expect(pair).toHaveLength(2);
    const byRole = Object.fromEntries(pair.map((p) => [p.role, p]));
    expect(byRole.SURVIVOR.action.hiveId).toBe(a.hive.id);
    expect(byRole.SURVIVOR.counterpartHiveId).toBe(b.hive.id);
    expect(byRole.ABSORBED.action.hiveId).toBe(b.hive.id);
    expect(byRole.ABSORBED.counterpartHiveId).toBe(a.hive.id);
    expect(pair.every((p) => p.boxesMoved === 1)).toBe(true);
    expect(pair.every((p) => p.keptQueenId === a.queen!.id)).toBe(true);
    expect(pair.every((p) => p.otherQueenFate === 'DEAD')).toBe(true);

    // The pair is exposed on each hive's timeline.
    const timeline = await request(app.getHttpServer())
      .get(`/actions?hiveId=${b.hive.id}`)
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .expect(200);
    expect(timeline.body).toHaveLength(1);
    expect(timeline.body[0].type).toBe('COMBINE');
    expect(timeline.body[0].details).toMatchObject({
      type: 'COMBINE',
      role: 'ABSORBED',
      counterpartHiveId: a.hive.id,
    });
  });

  it("moves the absorbed hive's queen into the survivor when she is kept", async () => {
    const a = await makeHive('Survivor B');
    const b = await makeHive('Absorbed B');

    await combine(a.hive.id, {
      absorbedHiveId: b.hive.id,
      keptQueenId: b.queen!.id,
      otherQueenFate: 'REPLACED',
    }).expect(201);

    const kept = await prisma.queen.findUniqueOrThrow({
      where: { id: b.queen!.id },
    });
    expect(kept.hiveId).toBe(a.hive.id);
    expect(kept.status).toBe('ACTIVE');
    const movement = await prisma.queenMovement.findFirst({
      where: { queenId: b.queen!.id },
    });
    expect(movement).toMatchObject({
      fromHiveId: b.hive.id,
      toHiveId: a.hive.id,
      reason: 'Colony combine',
    });

    const replaced = await prisma.queen.findUniqueOrThrow({
      where: { id: a.queen!.id },
    });
    expect(replaced.status).toBe('REPLACED');
    expect(replaced.replacedAt).not.toBeNull();
  });

  it('leaves boxes in place when moveBoxes is false', async () => {
    const a = await makeHive('Survivor C');
    const b = await makeHive('Absorbed C', { queen: false });

    const res = await combine(a.hive.id, {
      absorbedHiveId: b.hive.id,
      keptQueenId: a.queen!.id,
      moveBoxes: false,
    }).expect(201);

    const box = await prisma.box.findUniqueOrThrow({
      where: { id: b.boxes[0].id },
    });
    expect(box.hiveId).toBe(b.hive.id);
    const pair = await prisma.combineAction.findMany({
      where: { combineId: res.body.combineId },
    });
    expect(pair.every((p) => p.boxesMoved === 0)).toBe(true);
    // Only one queen existed, so there is no "other" queen.
    expect(pair.every((p) => p.otherQueenId === null)).toBe(true);
    expect(pair.every((p) => p.otherQueenFate === null)).toBe(true);
  });

  it('rejects combining a hive with itself', async () => {
    const a = await makeHive('Self D');
    await combine(a.hive.id, { absorbedHiveId: a.hive.id }).expect(400);
  });

  it('rejects hives in different apiaries', async () => {
    const otherApiary = await prisma.apiary.create({
      data: getRandomApiary({ userId, name: 'Combine Second Apiary' }),
    });
    const a = await makeHive('Survivor E');
    const b = await makeHive('Absorbed E', { inApiary: otherApiary.id });
    await combine(a.hive.id, { absorbedHiveId: b.hive.id }).expect(400);
  });

  it('rejects an already archived hive', async () => {
    const a = await makeHive('Survivor F');
    const b = await makeHive('Absorbed F');
    await prisma.hive.update({
      where: { id: b.hive.id },
      data: { status: 'ARCHIVED' },
    });
    await combine(a.hive.id, { absorbedHiveId: b.hive.id }).expect(400);
  });

  it('rejects a kept queen that is not a current queen of either hive', async () => {
    const a = await makeHive('Survivor G');
    const b = await makeHive('Absorbed G');
    const stranger = await makeHive('Stranger G');
    await combine(a.hive.id, {
      absorbedHiveId: b.hive.id,
      keptQueenId: stranger.queen!.id,
    }).expect(400);

    // Nothing changed.
    const absorbed = await prisma.hive.findUniqueOrThrow({
      where: { id: b.hive.id },
    });
    expect(absorbed.status).toBe('ACTIVE');
  });

  it("rejects absorbing another user's hive", async () => {
    const foreignApiary = await prisma.apiary.create({
      data: getRandomApiary({ userId: otherUserId, name: 'Foreign Apiary' }),
    });
    const a = await makeHive('Survivor H');
    const foreign = await makeHive('Foreign H', { inApiary: foreignApiary.id });
    await combine(a.hive.id, { absorbedHiveId: foreign.hive.id }).expect(404);

    const untouched = await prisma.hive.findUniqueOrThrow({
      where: { id: foreign.hive.id },
    });
    expect(untouched.status).toBe('ACTIVE');
  });

  it('re-dating one side re-dates the pair', async () => {
    const a = await makeHive('Survivor I');
    const b = await makeHive('Absorbed I');
    const res = await combine(a.hive.id, {
      absorbedHiveId: b.hive.id,
    }).expect(201);

    const survivorAction = await prisma.action.findFirstOrThrow({
      where: { hiveId: a.hive.id, type: 'COMBINE' },
    });
    const newDate = new Date('2026-05-01T12:00:00.000Z');
    await request(app.getHttpServer())
      .put(`/actions/${survivorAction.id}`)
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .send({ date: newDate.toISOString(), notes: 'Newspaper method' })
      .expect(200);

    const pair = await prisma.action.findMany({
      where: { combineAction: { combineId: res.body.combineId } },
    });
    expect(pair.every((p) => p.date.getTime() === newDate.getTime())).toBe(
      true,
    );
    const absorbed = await prisma.hive.findUniqueOrThrow({
      where: { id: b.hive.id },
    });
    expect(absorbed.status).toBe('ARCHIVED');
  });

  it('deleting one COMBINE action removes the pair; the absorbed hive stays archived', async () => {
    const a = await makeHive('Survivor J');
    const b = await makeHive('Absorbed J');
    const res = await combine(a.hive.id, {
      absorbedHiveId: b.hive.id,
    }).expect(201);

    const absorbedAction = await prisma.action.findFirstOrThrow({
      where: { hiveId: b.hive.id, type: 'COMBINE' },
    });
    await request(app.getHttpServer())
      .delete(`/actions/${absorbedAction.id}`)
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .expect(200);

    const remaining = await prisma.action.findMany({
      where: { hiveId: { in: [a.hive.id, b.hive.id] }, type: 'COMBINE' },
    });
    expect(remaining).toHaveLength(0);
    const rows = await prisma.combineAction.findMany({
      where: { combineId: res.body.combineId },
    });
    expect(rows).toHaveLength(0);
    const absorbed = await prisma.hive.findUniqueOrThrow({
      where: { id: b.hive.id },
    });
    expect(absorbed.status).toBe('ARCHIVED');
  });

  it('an older status change does not re-activate an absorbed hive', async () => {
    const a = await makeHive('Survivor K');
    const b = await makeHive('Absorbed K');

    // A status change logged before the combine…
    const statusRes = await request(app.getHttpServer())
      .post('/actions')
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .send({
        hiveId: b.hive.id,
        type: 'STATUS_CHANGE',
        date: '2026-01-01T12:00:00.000Z',
        details: { type: 'STATUS_CHANGE', toStatus: 'INACTIVE' },
      })
      .expect(201);
    await prisma.hive.update({
      where: { id: b.hive.id },
      data: { status: 'ACTIVE' },
    });

    await combine(a.hive.id, { absorbedHiveId: b.hive.id }).expect(201);

    // …edited afterwards still loses to the (newer) combine.
    await request(app.getHttpServer())
      .put(`/actions/${statusRes.body.id}`)
      .set('Cookie', authCookie)
      .set('x-apiary-id', apiaryId)
      .send({
        date: '2026-01-02T12:00:00.000Z',
        details: { type: 'STATUS_CHANGE', toStatus: 'ACTIVE' },
      })
      .expect(200);

    const absorbed = await prisma.hive.findUniqueOrThrow({
      where: { id: b.hive.id },
    });
    expect(absorbed.status).toBe('ARCHIVED');
  });

  it('refuses to create COMBINE or SPLIT actions through POST /actions', async () => {
    const a = await makeHive('Direct L');
    for (const type of ['COMBINE', 'SPLIT']) {
      await request(app.getHttpServer())
        .post('/actions')
        .set('Cookie', authCookie)
        .set('x-apiary-id', apiaryId)
        .send({ hiveId: a.hive.id, type, details: { type } })
        .expect(400);
    }
  });
});
