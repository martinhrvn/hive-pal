import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { setupApp, setupApiary, setupHive, setupUser } from './fixtures/setup';

/**
 * Optional apiary scope: on @ApiaryOptional() handlers the x-apiary-id header
 * is a filter for reads and ignored for writes, which authorize against the
 * resource's own apiary. The user owns apiary A, edits apiary B and can only
 * view apiary C (B and C belong to another user).
 */
describe('Optional apiary scope (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let me: { userId: string; authCookie: string[] };
  let other: { userId: string; authCookie: string[] };
  let apiaryA: string;
  let apiaryB: string;
  let apiaryC: string;
  let hiveA: string;
  let hiveB: string;
  let hiveC: string;

  const asMe = (req: request.Test) => req.set('Cookie', me.authCookie);

  beforeAll(async () => {
    ({ app, prisma } = await setupApp());
    me = await setupUser(app);
    other = await setupUser(app);

    apiaryA = await setupApiary(app, me.userId);
    apiaryB = await setupApiary(app, other.userId);
    apiaryC = await setupApiary(app, other.userId);
    await prisma.apiaryMember.createMany({
      data: [
        {
          apiaryId: apiaryB,
          userId: me.userId,
          role: 'EDITOR',
          status: 'ACTIVE',
        },
        {
          apiaryId: apiaryC,
          userId: me.userId,
          role: 'VIEWER',
          status: 'ACTIVE',
        },
      ],
    });

    hiveA = await setupHive(app, apiaryA);
    hiveB = await setupHive(app, apiaryB);
    hiveC = await setupHive(app, apiaryC);
  });

  afterAll(async () => {
    const userIds = [me.userId, other.userId];
    await prisma.queenMovement.deleteMany({
      where: { queen: { movements: { some: {} } } },
    });
    await prisma.queen.deleteMany({
      where: {
        OR: [
          { hiveId: null },
          { hive: { apiary: { userId: { in: userIds } } } },
        ],
      },
    });
    await prisma.todo.deleteMany({
      where: { apiary: { userId: { in: userIds } } },
    });
    await prisma.quickCheck.deleteMany({
      where: { apiary: { userId: { in: userIds } } },
    });
    await prisma.batchInspection.deleteMany({
      where: { apiary: { userId: { in: userIds } } },
    });
    await prisma.harvest.deleteMany({
      where: { apiary: { userId: { in: userIds } } },
    });
    await prisma.action.deleteMany({
      where: { hive: { apiary: { userId: { in: userIds } } } },
    });
    await prisma.inspection.deleteMany({
      where: { hive: { apiary: { userId: { in: userIds } } } },
    });
    await prisma.hive.deleteMany({
      where: { apiary: { userId: { in: userIds } } },
    });
    await prisma.apiaryMember.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.apiary.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  describe('reads', () => {
    it('lists hives from every accessible apiary when no apiary is selected', async () => {
      const res = await asMe(request(app.getHttpServer()).get('/hives')).expect(
        200,
      );
      const ids = res.body.map((h: { id: string }) => h.id);
      expect(ids).toEqual(expect.arrayContaining([hiveA, hiveB, hiveC]));
    });

    it('uses a selected apiary as a filter', async () => {
      const res = await asMe(request(app.getHttpServer()).get('/hives'))
        .set('x-apiary-id', apiaryA)
        .expect(200);
      const ids = res.body.map((h: { id: string }) => h.id);
      expect(ids).toEqual([hiveA]);

      // A detail read outside the selected apiary is filtered out too.
      await asMe(request(app.getHttpServer()).get(`/hives/${hiveB}`))
        .set('x-apiary-id', apiaryA)
        .expect(404);
    });

    it('still requires the header on handlers that have not opted in', async () => {
      await asMe(
        request(app.getHttpServer()).get('/reports/statistics'),
      ).expect(400);
    });

    it('loads inspection photos of another apiary in the "all" scope', async () => {
      const inspection = await prisma.inspection.create({
        data: { hiveId: hiveB, date: new Date() },
      });
      const res = await asMe(
        request(app.getHttpServer()).get(
          `/inspections/${inspection.id}/photos`,
        ),
      )
        .set('x-apiary-id', 'all')
        .expect(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('todos', () => {
    it('completes a todo of another apiary regardless of the selected apiary', async () => {
      const todo = await prisma.todo.create({
        data: { title: 'Feed B', apiaryId: apiaryB },
      });
      const res = await asMe(
        request(app.getHttpServer()).patch(`/todos/${todo.id}`),
      )
        .set('x-apiary-id', apiaryA)
        .send({ completed: true })
        .expect(200);
      expect(res.body.completed).toBe(true);
      expect(res.body.apiaryId).toBe(apiaryB);
    });

    it('refuses to edit a todo in a view-only apiary', async () => {
      const todo = await prisma.todo.create({
        data: { title: 'Feed C', apiaryId: apiaryC },
      });
      await asMe(request(app.getHttpServer()).patch(`/todos/${todo.id}`))
        .set('x-apiary-id', apiaryA)
        .send({ completed: true })
        .expect(404);
    });

    it("creates a todo in the hive's apiary, not the selected one", async () => {
      const res = await asMe(request(app.getHttpServer()).post('/todos'))
        .set('x-apiary-id', apiaryA)
        .send({ title: 'Check hive B', hiveId: hiveB })
        .expect(201);
      expect(res.body.apiaryId).toBe(apiaryB);
    });

    it('refuses to create a todo in a view-only apiary', async () => {
      await asMe(request(app.getHttpServer()).post('/todos'))
        .set('x-apiary-id', apiaryC)
        .send({ title: 'Nope' })
        .expect(404);
    });

    it('lists todos across apiaries without a header and filters with one', async () => {
      const all = await asMe(request(app.getHttpServer()).get('/todos')).expect(
        200,
      );
      const apiaries = new Set(
        all.body.map((t: { apiaryId: string }) => t.apiaryId),
      );
      expect(apiaries).toEqual(new Set([apiaryB, apiaryC]));

      const onlyB = await asMe(request(app.getHttpServer()).get('/todos'))
        .set('x-apiary-id', apiaryB)
        .expect(200);
      expect(
        onlyB.body.every((t: { apiaryId: string }) => t.apiaryId === apiaryB),
      ).toBe(true);
    });
  });

  describe('queens', () => {
    it('transfers a queen to a hive in another writable apiary and back', async () => {
      const queen = await prisma.queen.create({
        data: { hiveId: hiveA, year: 2025, installedAt: new Date() },
      });

      const moved = await asMe(
        request(app.getHttpServer()).post(`/queens/${queen.id}/transfer`),
      )
        .set('x-apiary-id', apiaryA)
        .send({ toHiveId: hiveB, reason: 'Requeening B' })
        .expect(201);
      expect(moved.body.hiveId).toBe(hiveB);
      expect(moved.body.apiaryId).toBe(apiaryB);
      expect(moved.body.movements[0]).toMatchObject({
        fromHiveId: hiveA,
        toHiveId: hiveB,
      });

      // A view-only apiary is never a valid target.
      await asMe(
        request(app.getHttpServer()).post(`/queens/${queen.id}/transfer`),
      )
        .send({ toHiveId: hiveC })
        .expect(404);

      // And back, without any selected apiary.
      const back = await asMe(
        request(app.getHttpServer()).post(`/queens/${queen.id}/transfer`),
      )
        .send({ toHiveId: hiveA })
        .expect(201);
      expect(back.body.hiveId).toBe(hiveA);
      expect(back.body.apiaryId).toBe(apiaryA);
    });

    it('refuses to move a queen that lives in a view-only apiary', async () => {
      const queen = await prisma.queen.create({
        data: { hiveId: hiveC, year: 2025 },
      });
      await asMe(
        request(app.getHttpServer()).post(`/queens/${queen.id}/transfer`),
      )
        .send({ toHiveId: hiveA })
        .expect(404);
    });

    it('lists the queen with its apiary in the "all" scope', async () => {
      const res = await asMe(request(app.getHttpServer()).get('/queens'))
        .set('x-apiary-id', 'all')
        .expect(200);
      const inA = res.body.find((q: { hiveId: string }) => q.hiveId === hiveA);
      expect(inA).toMatchObject({ apiaryId: apiaryA });
    });
  });

  describe('hives and inspections', () => {
    it('refuses to create a hive in a view-only apiary, whatever the header says', async () => {
      await asMe(request(app.getHttpServer()).post('/hives'))
        .set('x-apiary-id', apiaryA)
        .send({
          name: 'Sneaky',
          apiaryId: apiaryC,
          installationDate: new Date().toISOString(),
          status: 'ACTIVE',
        })
        .expect(404);
    });

    it('creates a hive in another writable apiary', async () => {
      const res = await asMe(request(app.getHttpServer()).post('/hives'))
        .set('x-apiary-id', apiaryA)
        .send({
          name: 'Editor hive',
          apiaryId: apiaryB,
          installationDate: new Date().toISOString(),
          status: 'ACTIVE',
        })
        .expect(201);
      const created = await prisma.hive.findUnique({
        where: { id: res.body.id },
      });
      expect(created?.apiaryId).toBe(apiaryB);
    });

    it('only moves a hive into an apiary the user can edit', async () => {
      const hive = await setupHive(app, apiaryA);

      await asMe(request(app.getHttpServer()).patch(`/hives/${hive}`))
        .send({ id: hive, apiaryId: apiaryC })
        .expect(404);
      expect(
        (await prisma.hive.findUnique({ where: { id: hive } }))?.apiaryId,
      ).toBe(apiaryA);

      await asMe(request(app.getHttpServer()).patch(`/hives/${hive}`))
        .send({ id: hive, apiaryId: apiaryB })
        .expect(200);
      expect(
        (await prisma.hive.findUnique({ where: { id: hive } }))?.apiaryId,
      ).toBe(apiaryB);
    });

    it('refuses to edit a hive in a view-only apiary', async () => {
      await asMe(request(app.getHttpServer()).patch(`/hives/${hiveC}`))
        .send({ id: hiveC, name: 'Renamed' })
        .expect(404);
    });

    it('only re-parents an inspection to a hive the user can edit', async () => {
      const inspection = await prisma.inspection.create({
        data: { hiveId: hiveA, date: new Date() },
      });

      await asMe(
        request(app.getHttpServer()).patch(`/inspections/${inspection.id}`),
      )
        .send({ hiveId: hiveC })
        .expect(404);

      await asMe(
        request(app.getHttpServer()).patch(`/inspections/${inspection.id}`),
      )
        .send({ hiveId: hiveB })
        .expect(200);
      expect(
        (await prisma.inspection.findUnique({ where: { id: inspection.id } }))
          ?.hiveId,
      ).toBe(hiveB);
    });

    it('refuses to create an inspection on a hive in a view-only apiary', async () => {
      await asMe(request(app.getHttpServer()).post('/inspections'))
        .send({ hiveId: hiveC, date: new Date().toISOString() })
        .expect(404);
    });
  });

  describe('other migrated modules', () => {
    it('lists photos and calendar events across apiaries without a header', async () => {
      const photos = await asMe(
        request(app.getHttpServer()).get('/photos'),
      ).expect(200);
      expect(Array.isArray(photos.body)).toBe(true);
      const calendar = await asMe(
        request(app.getHttpServer()).get('/calendar'),
      ).expect(200);
      expect(calendar.body).toBeDefined();
    });

    it("creates a quick check in the hive's apiary and refuses a view-only apiary", async () => {
      const res = await asMe(request(app.getHttpServer()).post('/quick-checks'))
        .set('x-apiary-id', apiaryA)
        .send({ hiveId: hiveB, apiaryId: apiaryB, note: 'Bees flying' })
        .expect(201);
      expect(res.body.apiaryId).toBe(apiaryB);

      await asMe(request(app.getHttpServer()).post('/quick-checks'))
        .set('x-apiary-id', apiaryC)
        .send({ apiaryId: apiaryC, note: 'Nope' })
        .expect(404);
    });

    it('lets an editor create a batch inspection and refuses a viewer', async () => {
      await asMe(request(app.getHttpServer()).post('/batch-inspections'))
        .set('x-apiary-id', apiaryB)
        .send({ name: 'Round B', apiaryId: apiaryB, hiveIds: [hiveB] })
        .expect(201);

      await asMe(request(app.getHttpServer()).post('/batch-inspections'))
        .set('x-apiary-id', apiaryC)
        .send({ name: 'Round C', apiaryId: apiaryC, hiveIds: [hiveC] })
        .expect(403);
    });

    it('lets an editor create and see a harvest, and hides a viewer apiary from edits', async () => {
      const created = await asMe(request(app.getHttpServer()).post('/harvests'))
        .set('x-apiary-id', apiaryB)
        .send({
          date: new Date().toISOString(),
          harvestHives: [{ hiveId: hiveB, framesTaken: 2 }],
        })
        .expect(201);

      const list = await asMe(
        request(app.getHttpServer()).get('/harvests'),
      ).expect(200);
      expect(list.body.map((h: { id: string }) => h.id)).toContain(
        created.body.id,
      );

      // A harvest in the view-only apiary, created by its owner, cannot be edited.
      const theirs = await request(app.getHttpServer())
        .post('/harvests')
        .set('Cookie', other.authCookie)
        .set('x-apiary-id', apiaryC)
        .send({
          date: new Date().toISOString(),
          harvestHives: [{ hiveId: hiveC, framesTaken: 1 }],
        })
        .expect(201);
      await asMe(
        request(app.getHttpServer()).put(`/harvests/${theirs.body.id}`),
      )
        .send({ notes: 'mine now' })
        .expect(404);
      // ...but it is visible to the viewer.
      await asMe(
        request(app.getHttpServer()).get(`/harvests/${theirs.body.id}`),
      ).expect(200);
    });
  });

  describe('actions', () => {
    it('records an action on a hive of another apiary as an editor', async () => {
      const res = await asMe(request(app.getHttpServer()).post('/actions'))
        .set('x-apiary-id', apiaryA)
        .send({
          hiveId: hiveB,
          type: 'NOTE',
          notes: 'from the all-apiaries view',
          details: { type: 'NOTE', content: 'Checked stores' },
        })
        .expect(201);
      expect(res.body.hiveId).toBe(hiveB);

      const list = await asMe(request(app.getHttpServer()).get('/actions'))
        .query({ hiveId: hiveB })
        .set('x-apiary-id', 'all')
        .expect(200);
      expect(list.body.map((a: { id: string }) => a.id)).toContain(res.body.id);
    });

    it('refuses an action on a hive in a view-only apiary', async () => {
      await asMe(request(app.getHttpServer()).post('/actions'))
        .send({
          hiveId: hiveC,
          type: 'NOTE',
          details: { type: 'NOTE', content: 'Nope' },
        })
        .expect(403);
    });

    it('never lists actions the user cannot access', async () => {
      const stranger = await setupUser(app);
      const res = await request(app.getHttpServer())
        .get('/actions')
        .set('Cookie', stranger.authCookie)
        .expect(200);
      expect(res.body).toEqual([]);
      await prisma.user.delete({ where: { id: stranger.userId } });
    });
  });
});
