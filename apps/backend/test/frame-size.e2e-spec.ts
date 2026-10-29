import { randomUUID } from 'crypto';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { getRandomApiary } from './fixtures/apiary';
import { getRandomHive } from './fixtures/hive';
import { createTestUser, loginAndGetCookie } from './helpers/auth';

describe('Frame sizes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Unique per run: setup-e2e wipes users/hives/apiaries between files but not
  // the shared frame-size catalogue, whose `name` is globally unique.
  const suffix = randomUUID().slice(0, 8);
  const sizeName = `E2E 12x10 ${suffix}`;
  const otherSizeName = `E2E Other ${suffix}`;
  const builtInName = `E2E Built-in ${suffix}`;

  let ownerId: string;
  let otherId: string;
  let adminId: string;
  let ownerCookies: string[];
  let otherCookies: string[];
  let adminCookies: string[];

  let frameSizeId: string;
  let otherFrameSizeId: string;
  let builtInId: string;
  let apiaryId: string;
  let hiveId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);

    const owner = await createTestUser(prisma, {
      email: `frame-size-owner-${suffix}@example.com`,
      password: 'password123',
    });
    ownerId = owner.id;
    ownerCookies = await loginAndGetCookie(app, owner.email, 'password123');

    const other = await createTestUser(prisma, {
      email: `frame-size-other-${suffix}@example.com`,
      password: 'password123',
    });
    otherId = other.id;
    otherCookies = await loginAndGetCookie(app, other.email, 'password123');

    const admin = await createTestUser(prisma, {
      email: `frame-size-admin-${suffix}@example.com`,
      password: 'password123',
      role: 'ADMIN',
    });
    adminId = admin.id;
    adminCookies = await loginAndGetCookie(app, admin.email, 'password123');

    const builtIn = await prisma.frameSize.create({
      data: {
        name: builtInName,
        width: 448,
        height: 232,
        depth: 25,
        isBuiltIn: true,
        status: 'APPROVED',
      },
    });
    builtInId = builtIn.id;
  });

  afterAll(async () => {
    await prisma.frameSize.deleteMany({
      where: { id: { in: [frameSizeId, otherFrameSizeId, builtInId] } },
    });
    await prisma.box.deleteMany({ where: { hive: { apiaryId } } });
    await prisma.hive.deleteMany({ where: { apiaryId } });
    await prisma.apiary.deleteMany({ where: { id: apiaryId } });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, otherId, adminId] } },
    });
    await app.close();
  });

  it('creates a submission as pending', async () => {
    const response = await request(app.getHttpServer())
      .post('/frame-sizes')
      .set('Cookie', ownerCookies)
      .send({ name: sizeName, width: 300, height: 250, depth: 12 })
      .expect(201);

    frameSizeId = response.body.id;
    expect(response.body.name).toBe(sizeName);
    expect(response.body.status).toBe('PENDING');
    expect(response.body.createdByUserId).toBe(ownerId);
    expect(response.body.isBuiltIn).toBe(false);
  });

  it('lets the creator correct the name and dimensions', async () => {
    const response = await request(app.getHttpServer())
      .put(`/frame-sizes/${frameSizeId}`)
      .set('Cookie', ownerCookies)
      .send({ name: `${sizeName} corrected`, width: 320 })
      .expect(200);

    expect(response.body.id).toBe(frameSizeId);
    expect(response.body.name).toBe(`${sizeName} corrected`);
    expect(response.body.width).toBe(320);
    // Untouched fields survive, and the review status is not reset.
    expect(response.body.height).toBe(250);
    expect(response.body.depth).toBe(12);
    expect(response.body.status).toBe('PENDING');
  });

  it('lets an admin edit another user’s size', async () => {
    const response = await request(app.getHttpServer())
      .put(`/frame-sizes/${frameSizeId}`)
      .set('Cookie', adminCookies)
      .send({ depth: 13 })
      .expect(200);

    expect(response.body.depth).toBe(13);
    expect(response.body.status).toBe('PENDING');
  });

  it('rejects edits from users who did not create the size', async () => {
    await request(app.getHttpServer())
      .put(`/frame-sizes/${frameSizeId}`)
      .set('Cookie', otherCookies)
      .send({ width: 999 })
      .expect(403);

    const unchanged = await prisma.frameSize.findUnique({
      where: { id: frameSizeId },
    });
    expect(unchanged?.width).toBe(320);
  });

  it('rejects editing built-in sizes, even for an admin', async () => {
    await request(app.getHttpServer())
      .put(`/frame-sizes/${builtInId}`)
      .set('Cookie', ownerCookies)
      .send({ width: 500 })
      .expect(400);

    await request(app.getHttpServer())
      .put(`/frame-sizes/${builtInId}`)
      .set('Cookie', adminCookies)
      .send({ width: 500 })
      .expect(400);
  });

  it('rejects a name that is already taken', async () => {
    const created = await request(app.getHttpServer())
      .post('/frame-sizes')
      .set('Cookie', otherCookies)
      .send({ name: otherSizeName, width: 330, height: 205, depth: 20 })
      .expect(201);
    otherFrameSizeId = created.body.id;

    await request(app.getHttpServer())
      .put(`/frame-sizes/${frameSizeId}`)
      .set('Cookie', ownerCookies)
      .send({ name: otherSizeName })
      .expect(409);
  });

  it('rejects invalid or empty payloads', async () => {
    await request(app.getHttpServer())
      .put(`/frame-sizes/${frameSizeId}`)
      .set('Cookie', ownerCookies)
      .send({})
      .expect(400);

    await request(app.getHttpServer())
      .put(`/frame-sizes/${frameSizeId}`)
      .set('Cookie', ownerCookies)
      .send({ width: 0 })
      .expect(400);

    await request(app.getHttpServer())
      .put(`/frame-sizes/${frameSizeId}`)
      .set('Cookie', ownerCookies)
      .send({ width: -5, height: 0, depth: 0 })
      .expect(400);

    await request(app.getHttpServer())
      .put(`/frame-sizes/${frameSizeId}`)
      .set('Cookie', ownerCookies)
      .send({ name: 'x' })
      .expect(400);
  });

  it('returns 404 for an unknown frame size', async () => {
    await request(app.getHttpServer())
      .put(`/frame-sizes/${randomUUID()}`)
      .set('Cookie', ownerCookies)
      .send({ width: 300 })
      .expect(404);
  });

  it('updates the dimensions of every box that uses the size', async () => {
    const apiary = await prisma.apiary.create({
      data: getRandomApiary({ userId: ownerId, name: `E2E Apiary ${suffix}` }),
    });
    apiaryId = apiary.id;

    const hive = await prisma.hive.create({
      data: getRandomHive({ apiaryId, name: `E2E Hive ${suffix}` }),
    });
    hiveId = hive.id;

    await prisma.box.create({
      data: {
        hiveId,
        position: 0,
        frameCount: 10,
        maxFrameCount: 10,
        hasExcluder: false,
        type: 'BROOD',
        frameSizeId,
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/hives/${hiveId}`)
      .set('Cookie', ownerCookies)
      .set('x-apiary-id', apiaryId)
      .expect(200);

    const box = response.body.boxes.find(
      (candidate: { frameSizeId: string }) =>
        candidate.frameSizeId === frameSizeId,
    );
    expect(box).toBeDefined();
    expect(box.frameSize.width).toBe(320);
    expect(box.frameSize.depth).toBe(13);
  });

  it('keeps a pending size visible to its creator and admins only', async () => {
    const otherView = await request(app.getHttpServer())
      .get('/frame-sizes')
      .set('Cookie', otherCookies)
      .expect(200);
    expect(otherView.body.map((size: { id: string }) => size.id)).not.toContain(
      frameSizeId,
    );

    const ownerView = await request(app.getHttpServer())
      .get('/frame-sizes')
      .set('Cookie', ownerCookies)
      .expect(200);
    expect(ownerView.body.map((size: { id: string }) => size.id)).toContain(
      frameSizeId,
    );

    const adminView = await request(app.getHttpServer())
      .get('/admin/frame-sizes')
      .set('Cookie', adminCookies)
      .expect(200);
    expect(adminView.body.map((size: { id: string }) => size.id)).toContain(
      frameSizeId,
    );
  });
});
