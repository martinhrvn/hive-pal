import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { setupApp, setupApiary, setupHive, setupUser } from './fixtures/setup';

/** Queen profile (#251): breeding, mating, traits and lineage. */
describe('Queens (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let me: { userId: string; authCookie: string[] };
  let other: { userId: string; authCookie: string[] };
  let hiveA: string;
  let hiveB: string;
  let hiveC: string;
  let apiaryId: string;
  let foreignQueenId: string;

  const asMe = (req: request.Test) => req.set('Cookie', me.authCookie);
  const http = () => request(app.getHttpServer());

  const createQueen = async (body: Record<string, unknown>) => {
    const res = await asMe(http().post('/queens'))
      .send({ year: new Date().getFullYear(), ...body })
      .expect(201);
    return res.body as { id: string } & Record<string, unknown>;
  };

  beforeAll(async () => {
    ({ app, prisma } = await setupApp());
    me = await setupUser(app);
    other = await setupUser(app);

    apiaryId = await setupApiary(app, me.userId);
    hiveA = await setupHive(app, apiaryId);
    hiveB = await setupHive(app, apiaryId);
    hiveC = await setupHive(app, apiaryId);

    const foreignApiary = await setupApiary(app, other.userId);
    const foreignHive = await setupHive(app, foreignApiary);
    foreignQueenId = (
      await prisma.queen.create({ data: { hiveId: foreignHive, year: 2024 } })
    ).id;
  });

  afterAll(async () => {
    const userIds = [me.userId, other.userId];
    const apiaryWhere = { apiary: { userId: { in: userIds } } };
    await prisma.queenMovement.deleteMany({
      where: { queen: { hive: apiaryWhere } },
    });
    await prisma.queen.deleteMany({ where: { hive: apiaryWhere } });
    await prisma.hive.deleteMany({ where: apiaryWhere });
    await prisma.apiary.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('stores and returns breeding, mating and trait fields', async () => {
    const queen = await createQueen({
      hiveId: hiveA,
      status: 'ACTIVE',
      breeder: 'Hans Muster',
      line: 'Carnica Troiseck',
      notes: 'Very calm on the comb',
      matingType: 'MATING_STATION',
      matingStation: 'Bergstation',
      matedAt: '2026-06-01T00:00:00.000Z',
      gentleness: 5,
      hygiene: 4,
      swarmResistance: 3,
      honeyProduction: 2,
    });

    const res = await asMe(http().get(`/queens/${queen.id}`)).expect(200);
    expect(res.body).toMatchObject({
      breeder: 'Hans Muster',
      line: 'Carnica Troiseck',
      notes: 'Very calm on the comb',
      matingType: 'MATING_STATION',
      matingStation: 'Bergstation',
      matedAt: '2026-06-01T00:00:00.000Z',
      gentleness: 5,
      hygiene: 4,
      swarmResistance: 3,
      honeyProduction: 2,
    });
  });

  it("makes a virgin queen the hive's queen and dates her status", async () => {
    const laying = await createQueen({ hiveId: hiveC, status: 'ACTIVE' });
    const virgin = await createQueen({
      hiveId: hiveC,
      status: 'VIRGIN',
      cellCappedAt: '2026-06-01T00:00:00.000Z',
      emergedAt: '2026-06-09T00:00:00.000Z',
    });
    expect(virgin).toMatchObject({
      status: 'VIRGIN',
      cellCappedAt: '2026-06-01T00:00:00.000Z',
      emergedAt: '2026-06-09T00:00:00.000Z',
      statusChangedAt: expect.any(String),
    });

    // She replaces the laying queen and heads the hive
    const old = await asMe(http().get(`/queens/${laying.id}`)).expect(200);
    expect(old.body.status).toBe('REPLACED');
    const hive = await asMe(http().get(`/hives/${hiveC}`))
      .set('x-apiary-id', apiaryId)
      .expect(200);
    expect(hive.body.activeQueen).toMatchObject({
      id: virgin.id,
      status: 'VIRGIN',
    });

    const mated = await asMe(http().patch(`/queens/${virgin.id}`))
      .send({ status: 'ACTIVE' })
      .expect(200);
    expect(new Date(mated.body.statusChangedAt).getTime()).toBeGreaterThan(
      new Date(virgin.statusChangedAt as string).getTime(),
    );
  });

  it('rejects a rating outside 1-5', async () => {
    await asMe(http().post('/queens'))
      .send({ hiveId: hiveA, year: 2025, gentleness: 6 })
      .expect(400);
  });

  it('shows the mother and her daughters in the queen history', async () => {
    const mother = await createQueen({ hiveId: hiveA, name: 'Mother' });
    const daughter = await createQueen({
      hiveId: hiveB,
      name: 'Daughter',
      motherQueenId: mother.id,
    });

    const motherRes = await asMe(
      http().get(`/queens/${mother.id}/history`),
    ).expect(200);
    expect(motherRes.body.daughters).toEqual([
      expect.objectContaining({ id: daughter.id, name: 'Daughter' }),
    ]);

    const daughterRes = await asMe(
      http().get(`/queens/${daughter.id}/history`),
    ).expect(200);
    expect(daughterRes.body.motherQueenId).toBe(mother.id);
    expect(daughterRes.body.motherQueen).toMatchObject({
      id: mother.id,
      name: 'Mother',
    });
  });

  it('rejects a lineage cycle and a queen as her own mother', async () => {
    const mother = await createQueen({ hiveId: hiveA });
    const daughter = await createQueen({
      hiveId: hiveB,
      motherQueenId: mother.id,
    });

    await asMe(http().patch(`/queens/${mother.id}`))
      .send({ motherQueenId: daughter.id })
      .expect(400);
    await asMe(http().patch(`/queens/${mother.id}`))
      .send({ motherQueenId: mother.id })
      .expect(400);
  });

  it('rejects a mother from an apiary the user cannot access', async () => {
    await asMe(http().post('/queens'))
      .send({ hiveId: hiveA, year: 2025, motherQueenId: foreignQueenId })
      .expect(400);
  });

  it('keeps dates that a PATCH does not mention', async () => {
    const queen = await createQueen({
      hiveId: hiveA,
      status: 'REPLACED',
      replacedAt: '2026-05-01T00:00:00.000Z',
    });

    const res = await asMe(http().patch(`/queens/${queen.id}`))
      .send({ name: 'Renamed' })
      .expect(200);
    expect(res.body.name).toBe('Renamed');
    expect(res.body.replacedAt).toBe('2026-05-01T00:00:00.000Z');
  });

  it('keeps daughters, without the link, when the mother is deleted', async () => {
    const mother = await createQueen({ hiveId: hiveA });
    const daughter = await createQueen({
      hiveId: hiveB,
      motherQueenId: mother.id,
    });

    await asMe(http().delete(`/queens/${mother.id}`)).expect(200);

    const res = await asMe(http().get(`/queens/${daughter.id}`)).expect(200);
    expect(res.body.motherQueenId).toBeNull();
  });
});
