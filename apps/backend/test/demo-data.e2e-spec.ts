import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedDemoData } from '../scripts/demo-data';
import { setupApp, setupUser } from './fixtures/setup';

/** The preview/local demo dataset must be readable through the real API. */
describe('Demo data (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let user: { userId: string; authCookie: string[] };

  const as = (req: request.Test) => req.set('Cookie', user.authCookie);
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    ({ app, prisma } = await setupApp());
    user = await setupUser(app);
    await seedDemoData(prisma as never, user.userId);
  });

  afterAll(async () => {
    const apiary = { userId: user.userId };
    await prisma.harvest.deleteMany({ where: { apiary } });
    await prisma.queenMovement.deleteMany({
      where: { queen: { hive: { apiary } } },
    });
    await prisma.hive.deleteMany({ where: { apiary } });
    await prisma.apiary.deleteMany({ where: apiary });
    await prisma.user.delete({ where: { id: user.userId } });
    await app.close();
  });

  it('creates two apiaries and six hives, one of them dead', async () => {
    const active = await as(http().get('/hives')).expect(200);
    expect(active.body).toHaveLength(5);
    const all = await as(http().get('/hives?includeInactive=true')).expect(200);
    expect(all.body).toHaveLength(6);

    const apiaries = await prisma.apiary.findMany({
      where: { userId: user.userId },
    });
    expect(apiaries).toHaveLength(2);
  });

  it('serves hive details with boxes, an active queen and scored inspections', async () => {
    const hive = await prisma.hive.findFirstOrThrow({
      where: { name: 'Hive 01', apiary: { userId: user.userId } },
    });

    const detail = await as(http().get(`/hives/${hive.id}`))
      .set('x-apiary-id', hive.apiaryId!)
      .expect(200);
    expect(detail.body.boxes).toHaveLength(3);
    expect(detail.body.activeQueen).toMatchObject({ status: 'ACTIVE' });

    const inspections = await as(http().get(`/inspections?hiveId=${hive.id}`))
      .set('x-apiary-id', hive.apiaryId!)
      .expect(200);
    const completed = inspections.body.filter(
      (i: { status: string }) => i.status === 'COMPLETED',
    );
    expect(completed.length).toBeGreaterThan(5);
    expect(completed[0].score.overallScore).toEqual(expect.any(Number));
  });

  it('serves the harvest of the home apiary', async () => {
    const harvest = await prisma.harvest.findFirstOrThrow({
      where: { apiary: { userId: user.userId } },
    });
    const res = await as(http().get(`/harvests/${harvest.id}`))
      .set('x-apiary-id', harvest.apiaryId)
      .expect(200);
    expect(res.body.status).toBe('COMPLETED');
  });
});
