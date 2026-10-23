import {
  test as base,
  expect,
  request,
  APIRequestContext,
  BrowserContext,
  TestInfo,
} from '@playwright/test';

export { expect };

/**
 * Shared fixtures for the smoke suite.
 *
 * Every spec file gets its own freshly signed-up user, created through the
 * API, so specs never share state and can run in parallel against a single
 * deployment. The backend auto-creates an apiary named "My Apiary" for each
 * new user; its id is exposed as `apiaryId`.
 */

export const DEFAULT_APIARY_NAME = 'My Apiary';
/** localStorage key the frontend uses for the active apiary (auth-provider.tsx). */
export const APIARY_SELECTION_KEY = 'hive_pal_apiary_selection';

export type SmokeUser = {
  email: string;
  password: string;
  name: string;
  userId: string;
  /** Id of the auto-created "My Apiary". */
  apiaryId: string;
  api: SmokeApi;
  /** Cookies of the signed-in API session (for `browser.newContext`). */
  storageState: () => Promise<{
    cookies: Awaited<ReturnType<BrowserContext['cookies']>>;
    origins: [];
  }>;
};

export type SmokeFixtures = {
  /** Display name for `freshUser` (option; guides use a friendlier one). */
  freshUserName: string | undefined;
  /** Signed-up user whose session is injected into the default browser context. */
  freshUser: SmokeUser;
  /** A second signed-up user without any browser session (use `newContext`). */
  secondUser: SmokeUser;
  /** Auto fixture: aborts third-party requests and slow weather/hivescale calls. */
  blockThirdParty: void;
};

export const test = base.extend<SmokeFixtures>({
  blockThirdParty: [
    async ({ page, baseURL }, use) => {
      const origin = new URL(baseURL ?? 'http://localhost:5173').origin;
      await page.route('**/*', route => {
        const url = route.request().url();
        if (!url.startsWith(origin)) return route.abort();
        if (/\/api\/(weather|hivescale)/.test(url)) return route.abort();
        return route.continue();
      });
      await use();
    },
    { auto: true },
  ],

  freshUserName: [undefined, { option: true }],

  freshUser: async ({ context, baseURL, freshUserName }, use, testInfo) => {
    const user = await signUpViaApi(baseURL!, testInfo, '', freshUserName);
    const state = await user.storageState();
    await context.addCookies(state.cookies);
    // Pre-select the apiary like a returning user would have. Without it the
    // editable-route guard can redirect before the app auto-selects the first
    // apiary (it checks permissions as soon as apiaries load).
    await context.addInitScript(
      ({ key, value }) => {
        if (!window.localStorage.getItem(key))
          window.localStorage.setItem(key, value);
      },
      { key: APIARY_SELECTION_KEY, value: user.apiaryId },
    );
    await use(user);
    await user.api.dispose();
  },

  secondUser: async ({ baseURL }, use, testInfo) => {
    const user = await signUpViaApi(baseURL!, testInfo, 'second');
    await use(user);
    await user.api.dispose();
  },
});

// ---------------------------------------------------------------------------
// Sign-up helpers
// ---------------------------------------------------------------------------

export function smokeEmail(testInfo: TestInfo, suffix = ''): string {
  const runId = process.env.GITHUB_RUN_ID ?? 'local';
  const spec = testInfo.titlePath[0]
    .replace(/\.spec\.ts$/, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase();
  const tag = suffix ? `-${suffix}` : '';
  return `smoke+${runId}-${spec}${tag}-${Date.now()}-${randomString(4)}@e2e.hivepal.test`;
}

export function smokePassword(): string {
  return `Smoke!${randomString(10)}`;
}

export function randomString(length: number): string {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

/** Short unique suffix for names created during a test. */
export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now().toString().slice(-5)}${randomString(2)}`;
}

/**
 * Register a user through better-auth and return an API client bound to
 * that session. Handles the per-IP sign-up rate limit (3 requests / 10 s in
 * production mode) by honouring `Retry-After` on 429 responses.
 */
export async function signUpViaApi(
  baseURL: string,
  testInfo: TestInfo,
  suffix = '',
  name = suffix ? `Smoke ${suffix}` : 'Smoke Tester',
): Promise<SmokeUser> {
  const email = smokeEmail(testInfo, suffix);
  const password = smokePassword();

  const ctx = await request.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: new URL(baseURL).origin },
  });

  const deadline = Date.now() + 60_000;
  for (;;) {
    const res = await ctx.post('/api/auth/sign-up/email', {
      data: {
        email,
        password,
        name,
        privacyPolicyConsent: true,
        privacyConsentTimestamp: new Date().toISOString(),
        newsletterConsent: false,
      },
    });
    if (res.ok()) break;
    if (res.status() === 429 && Date.now() < deadline) {
      const retryAfter = Number(
        res.headers()['x-retry-after'] ?? res.headers()['retry-after'] ?? 5,
      );
      await new Promise(r => setTimeout(r, Math.min(retryAfter, 15) * 1000));
      continue;
    }
    throw new Error(`Sign-up failed: ${res.status()} ${await res.text()}`);
  }

  const session = await ctx.get('/api/auth/get-session');
  if (!session.ok()) throw new Error(`get-session failed: ${session.status()}`);
  const { user } = (await session.json()) as { user: { id: string } };

  const apiaries = await ctx.get('/api/apiaries');
  if (!apiaries.ok())
    throw new Error(`GET /api/apiaries failed: ${apiaries.status()}`);
  const { apiaries: list } = (await apiaries.json()) as {
    apiaries: { id: string; name: string }[];
  };
  const defaultApiary =
    list.find(a => a.name === DEFAULT_APIARY_NAME) ?? list[0];
  if (!defaultApiary)
    throw new Error('Expected the auto-created default apiary');

  return {
    email,
    password,
    name,
    userId: user.id,
    apiaryId: defaultApiary.id,
    api: new SmokeApi(ctx, defaultApiary.id),
    storageState: async () => {
      const state = await ctx.storageState();
      return { cookies: state.cookies, origins: [] };
    },
  };
}

// ---------------------------------------------------------------------------
// Minimal typed API client for seeding data
// ---------------------------------------------------------------------------

export type SeedHive = { id: string; status: string };
export type SeedInspection = {
  id: string;
  hiveId: string;
  status: string;
  date: string;
};
export type SeedApiary = { id: string; name: string };
export type SeedHarvest = { id: string; status: string };

export class SmokeApi {
  constructor(
    readonly ctx: APIRequestContext,
    /** Apiary sent as `x-apiary-id` unless a call overrides it. */
    public apiaryId: string,
  ) {}

  dispose() {
    return this.ctx.dispose();
  }

  private headers(apiaryId = this.apiaryId) {
    return { 'x-apiary-id': apiaryId, 'Content-Type': 'application/json' };
  }

  private async json<T>(
    res: Awaited<ReturnType<APIRequestContext['post']>>,
    what: string,
  ): Promise<T> {
    if (!res.ok())
      throw new Error(`${what} failed: ${res.status()} ${await res.text()}`);
    return (await res.json()) as T;
  }

  async features(): Promise<{ storageEnabled: boolean; aiEnabled: boolean }> {
    return this.json(
      await this.ctx.get('/api/features', { headers: this.headers() }),
      'GET /api/features',
    );
  }

  async listApiaries(): Promise<SeedApiary[]> {
    const body = await this.json<{ apiaries: SeedApiary[] }>(
      await this.ctx.get('/api/apiaries', { headers: this.headers() }),
      'GET /api/apiaries',
    );
    return body.apiaries;
  }

  async createApiary(data: {
    name: string;
    location?: string;
    latitude?: number;
    longitude?: number;
  }) {
    return this.json<SeedApiary>(
      await this.ctx.post('/api/apiaries', { data, headers: this.headers() }),
      'POST /api/apiaries',
    );
  }

  async updateApiary(id: string, data: Record<string, unknown>) {
    return this.json<SeedApiary>(
      await this.ctx.patch(`/api/apiaries/${id}`, {
        data,
        headers: this.headers(id),
      }),
      `PATCH /api/apiaries/${id}`,
    );
  }

  async deleteApiary(id: string) {
    const res = await this.ctx.delete(`/api/apiaries/${id}`, {
      headers: this.headers(id),
    });
    if (!res.ok())
      throw new Error(
        `DELETE /api/apiaries/${id} failed: ${res.status()} ${await res.text()}`,
      );
  }

  async createHive(data: {
    name: string;
    apiaryId?: string;
    notes?: string;
    installationDate?: string;
  }) {
    const apiaryId = data.apiaryId ?? this.apiaryId;
    return this.json<SeedHive>(
      await this.ctx.post('/api/hives', {
        data: { ...data, apiaryId, settings: {} },
        headers: this.headers(apiaryId),
      }),
      'POST /api/hives',
    );
  }

  async createInspection(data: {
    hiveId: string;
    date?: string;
    status?: 'COMPLETED' | 'SCHEDULED';
    notes?: string;
    temperature?: number;
    weatherConditions?: string;
    /** `observationSchema` fields from shared-schemas, passed through. */
    observations?: Record<string, unknown>;
    actions?: unknown[];
    apiaryId?: string;
  }) {
    const { apiaryId, ...rest } = data;
    return this.json<SeedInspection>(
      await this.ctx.post('/api/inspections', {
        data: { date: new Date().toISOString(), status: 'COMPLETED', ...rest },
        headers: this.headers(apiaryId),
      }),
      'POST /api/inspections',
    );
  }

  async listFrameSizes(): Promise<
    { id: string; name: string; isBuiltIn: boolean }[]
  > {
    return this.json(
      await this.ctx.get('/api/frame-sizes', { headers: this.headers() }),
      'GET /api/frame-sizes',
    );
  }

  /** Replace a hive's box stack (`boxSchema` from shared-schemas). */
  async setBoxes(hiveId: string, boxes: Record<string, unknown>[]) {
    return this.json<unknown>(
      await this.ctx.put(`/api/hives/${hiveId}/boxes`, {
        data: { boxes },
        headers: this.headers(),
      }),
      `PUT /api/hives/${hiveId}/boxes`,
    );
  }

  async createQueen(data: {
    hiveId: string;
    year: number | null;
    color?: string;
    marking?: string;
    apiaryId?: string;
  }) {
    const { apiaryId, ...rest } = data;
    return this.json<{ id: string }>(
      await this.ctx.post('/api/queens', {
        data: rest,
        headers: this.headers(apiaryId),
      }),
      'POST /api/queens',
    );
  }

  async createHarvest(data: {
    date?: string;
    notes?: string;
    harvestHives: { hiveId: string; framesTaken: number }[];
    apiaryId?: string;
  }) {
    const { apiaryId, ...rest } = data;
    return this.json<SeedHarvest>(
      await this.ctx.post('/api/harvests', {
        data: { date: new Date().toISOString(), ...rest },
        headers: this.headers(apiaryId),
      }),
      'POST /api/harvests',
    );
  }

  async setHarvestWeight(id: string, totalWeight: number, unit = 'kg') {
    return this.json<SeedHarvest>(
      await this.ctx.put(`/api/harvests/${id}/weight`, {
        data: { totalWeight, totalWeightUnit: unit },
        headers: this.headers(),
      }),
      `PUT /api/harvests/${id}/weight`,
    );
  }

  async finalizeHarvest(id: string) {
    return this.json<SeedHarvest>(
      await this.ctx.post(`/api/harvests/${id}/finalize`, {
        headers: this.headers(),
      }),
      `POST /api/harvests/${id}/finalize`,
    );
  }

  async createTodo(data: {
    title: string;
    hiveId?: string;
    dueDate?: string;
    apiaryId?: string;
  }) {
    const { apiaryId, ...rest } = data;
    return this.json<{ id: string }>(
      await this.ctx.post('/api/todos', {
        data: rest,
        headers: this.headers(apiaryId),
      }),
      'POST /api/todos',
    );
  }
}

/**
 * Build an API client from an existing browser session (for specs that sign
 * up through the UI instead of `freshUser`).
 */
export async function apiFromContext(
  context: BrowserContext,
  baseURL: string,
): Promise<SmokeApi> {
  const cookies = await context.cookies();
  const ctx = await request.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: new URL(baseURL).origin },
    storageState: { cookies, origins: [] },
  });
  const api = new SmokeApi(ctx, '');
  const apiaries = await api.listApiaries();
  api.apiaryId = apiaries[0]?.id ?? '';
  return api;
}
