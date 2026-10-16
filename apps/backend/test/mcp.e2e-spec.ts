import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { createTestUser, loginAndGetCookie } from './helpers/auth';

// Runs the OAuth flow an MCP client performs (dynamic registration →
// authorize → consent → token) and then calls tools on the MCP endpoint.
// Access tokens are verified against the JWKS at BETTER_AUTH_URL, so the app
// listens on that port.
const BASE_URL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
const RESOURCE = `${BASE_URL}/api/mcp`;
const REDIRECT_URI = 'http://localhost:9999/callback';

const base64url = (buf: Buffer) => buf.toString('base64url');

describe('MCP (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ownerId: string;
  let otherId: string;
  let ownHiveId: string;
  let otherHiveId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(new URL(BASE_URL).port || 3000);
    prisma = app.get(PrismaService);

    const owner = await createTestUser(prisma, {
      email: 'mcp-owner@example.com',
      password: 'password123',
    });
    const other = await createTestUser(prisma, {
      email: 'mcp-other@example.com',
      password: 'password123',
    });
    ownerId = owner.id;
    otherId = other.id;
    const [ownApiary, otherApiary] = await Promise.all([
      prisma.apiary.create({ data: { name: 'Own', userId: ownerId } }),
      prisma.apiary.create({ data: { name: 'Other', userId: otherId } }),
    ]);
    ownHiveId = (
      await prisma.hive.create({
        data: { name: 'Own hive', apiaryId: ownApiary.id },
      })
    ).id;
    otherHiveId = (
      await prisma.hive.create({
        data: { name: 'Other hive', apiaryId: otherApiary.id },
      })
    ).id;
  });

  afterAll(async () => {
    await prisma.hive.deleteMany({
      where: { id: { in: [ownHiveId, otherHiveId] } },
    });
    await prisma.apiary.deleteMany({
      where: { userId: { in: [ownerId, otherId] } },
    });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherId] } } });
    await app.close();
  });

  const server = () => app.getHttpServer();

  const mcpCall = (token: string | undefined, method: string, params = {}) => {
    const req = request(server())
      .post('/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .set('Content-Type', 'application/json');
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req.send({ jsonrpc: '2.0', id: 1, method, params });
  };

  async function getAccessToken(scope: string): Promise<string> {
    const registration = await request(server())
      .post('/api/auth/oauth2/register')
      .send({
        client_name: 'E2E MCP client',
        redirect_uris: [REDIRECT_URI],
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
      })
      .expect((res) => {
        if (res.status >= 300) throw new Error(JSON.stringify(res.body));
      });
    const clientId = registration.body.client_id as string;

    const cookie = await loginAndGetCookie(
      app,
      'mcp-owner@example.com',
      'password123',
    );
    const verifier = base64url(randomBytes(32));
    const challenge = base64url(createHash('sha256').update(verifier).digest());

    const authorize = await request(server())
      .get('/api/auth/oauth2/authorize')
      .query({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        scope,
        state: 'e2e',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        resource: RESOURCE,
      })
      .set('Cookie', cookie)
      .set('Accept', 'text/html')
      .redirects(0);
    const consentUrl = new URL(authorize.headers.location as string);
    expect(consentUrl.pathname).toBe('/oauth/consent');

    const consent = await request(server())
      .post('/api/auth/oauth2/consent')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ accept: true, oauth_query: consentUrl.search.slice(1) })
      .expect(200);
    const callback = new URL(
      (consent.body.url ?? consent.body.redirect_uri) as string,
    );
    const code = callback.searchParams.get('code');
    expect(code).toBeTruthy();

    const token = await request(server())
      .post('/api/auth/oauth2/token')
      .type('form')
      .send({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: clientId,
        code_verifier: verifier,
        resource: RESOURCE,
      })
      .expect(200);
    return token.body.access_token as string;
  }

  it('publishes protected resource metadata', async () => {
    const res = await request(server())
      .get('/.well-known/oauth-protected-resource/api/mcp')
      .expect(200);
    expect(res.body.resource).toBe(RESOURCE);
    expect(res.body.scopes_supported).toEqual(
      expect.arrayContaining(['hivepal:read', 'hivepal:write']),
    );
  });

  it('challenges unauthenticated requests', async () => {
    const res = await mcpCall(undefined, 'tools/list');
    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toContain('resource_metadata');
    expect(res.headers['www-authenticate']).toContain(
      'scope="hivepal:read hivepal:write"',
    );
  });

  it("lists only the user's own hives with a read token", async () => {
    const token = await getAccessToken('openid hivepal:read');

    const tools = await mcpCall(token, 'tools/list').expect(200);
    const names = (tools.body.result.tools as { name: string }[]).map(
      (t) => t.name,
    );
    expect(names).toContain('list_hives');
    expect(names).not.toContain('create_todo');

    const res = await mcpCall(token, 'tools/call', {
      name: 'list_hives',
      arguments: {},
    }).expect(200);
    const hives = JSON.parse(res.body.result.content[0].text) as {
      id: string;
    }[];
    const ids = hives.map((h) => h.id);
    expect(ids).toContain(ownHiveId);
    expect(ids).not.toContain(otherHiveId);
  });

  it('creates a todo with a write token', async () => {
    const token = await getAccessToken('openid hivepal:read hivepal:write');
    const res = await mcpCall(token, 'tools/call', {
      name: 'create_todo',
      arguments: { title: 'Add a super', hiveId: ownHiveId },
    }).expect(200);
    expect(res.body.result.isError).toBeFalsy();
    const todo = await prisma.todo.findFirst({
      where: { hiveId: ownHiveId, title: 'Add a super' },
    });
    expect(todo).not.toBeNull();
    await prisma.todo.deleteMany({ where: { hiveId: ownHiveId } });
  });
});
