import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const HIVE_ID = '22222222-2222-4222-8222-222222222222';
const QUEEN_ID = '33333333-3333-4333-8333-333333333333';
const MOTHER_ID = '44444444-4444-4444-8444-444444444444';
const STORY = 'pages/queen/components/form/queen-form/QueenFormRoutes';
const YEAR = new Date().getFullYear();

const queen = {
  id: QUEEN_ID,
  hiveId: HIVE_ID,
  hiveName: 'Volk 7',
  name: 'Bella',
  marking: null,
  color: 'blue',
  year: YEAR,
  source: null,
  status: 'ACTIVE',
  installedAt: '2026-04-12T10:00:00.000Z',
  replacedAt: '2026-09-01T10:00:00.000Z',
  apiaryId: null,
  apiaryName: null,
  notes: null,
  breeder: null,
  line: 'Carnica',
  motherQueenId: MOTHER_ID,
  motherQueen: {
    id: MOTHER_ID,
    name: 'Old Queen',
    year: YEAR - 2,
    color: 'yellow',
    status: 'REPLACED',
  },
  matingType: null,
  matingStation: null,
  matedAt: null,
  gentleness: 3,
  hygiene: null,
  swarmResistance: null,
  honeyProduction: null,
  movements: [],
  daughters: [],
};

type Sent = { method: string; path: string; body: Record<string, unknown> };

// Match only real API calls; a '**/api/**' glob would also catch vite module
// requests such as /src/api/hooks/*.ts and break the gallery.
async function mockApi(page: Page, sent: Sent[]) {
  await page.route(
    url => url.pathname.startsWith('/api/'),
    async route => {
      const request = route.request();
      const { pathname } = new URL(request.url());
      const method = request.method();
      if (method !== 'GET') {
        sent.push({ method, path: pathname, body: request.postDataJSON() });
        return route.fulfill({ json: { ...queen, id: QUEEN_ID } });
      }
      if (pathname === `/api/queens/${QUEEN_ID}/history`) {
        return route.fulfill({ json: queen });
      }
      if (pathname === `/api/hives/${HIVE_ID}`) {
        return route.fulfill({
          json: { id: HIVE_ID, name: 'Volk 7', activeQueen: null, boxes: [] },
        });
      }
      return route.fulfill({ json: [] });
    },
  );
}

test('creates a queen with mating details and trait ratings', async ({
  mount,
  page,
}) => {
  const sent: Sent[] = [];
  await mockApi(page, sent);
  await mount(STORY, { path: `/hives/${HIVE_ID}/queens/create` });

  // The hive comes from the URL, so it is shown instead of a picker
  await expect(page.getByText('Volk 7')).toBeVisible();

  // The station field only exists for station mating
  await expect(
    page.getByRole('textbox', { name: 'Mating station' }),
  ).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Mating' }).click();
  await page.getByRole('option', { name: 'Mating station' }).click();
  await page
    .getByRole('textbox', { name: 'Mating station' })
    .fill('Bergstation');

  await page.getByRole('button', { name: 'Rate Gentleness 4 of 5' }).click();
  await page.getByRole('button', { name: 'Rate Hygiene 2 of 5' }).click();
  await page.getByRole('button', { name: 'Clear Hygiene rating' }).click();

  await page.getByRole('button', { name: 'Create Queen' }).click();

  await expect(page.getByTestId('landed')).toHaveText(`/hives/${HIVE_ID}`);
  expect(sent).toHaveLength(1);
  expect(sent[0].body).toMatchObject({
    hiveId: HIVE_ID,
    year: YEAR,
    matingType: 'MATING_STATION',
    matingStation: 'Bergstation',
    gentleness: 4,
    hygiene: null,
  });
});

test('rejects a year outside the allowed range', async ({ mount, page }) => {
  const sent: Sent[] = [];
  await mockApi(page, sent);
  await mount(STORY, { path: `/hives/${HIVE_ID}/queens/create` });

  await page.getByRole('spinbutton', { name: 'Year' }).fill('1990');
  await page.getByRole('button', { name: 'Create Queen' }).click();

  await expect(page.getByText(/Enter a year between/)).toBeVisible();
  expect(sent).toHaveLength(0);
});

test('edits a queen without moving her or losing dates', async ({
  mount,
  page,
}) => {
  const sent: Sent[] = [];
  await mockApi(page, sent);
  await mount(STORY, { path: `/queens/${QUEEN_ID}/edit` });

  // Loaded values, and the hive is read-only (moves go through a transfer)
  await expect(page.getByLabel('Name')).toHaveValue('Bella');
  await expect(page.getByText(/use Transfer on the queen page/)).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Hive' })).toHaveCount(0);
  // A mother outside the loaded list still shows by name
  await expect(page.getByRole('combobox', { name: 'Mother' })).toContainText(
    'Old Queen',
  );

  await page.getByLabel('Breeder').fill('Hans Muster');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  await expect(page.getByTestId('landed')).toHaveText(`/queens/${QUEEN_ID}`);
  expect(sent).toHaveLength(1);
  expect(sent[0]).toMatchObject({
    method: 'PATCH',
    path: `/api/queens/${QUEEN_ID}`,
  });
  expect(sent[0].body).not.toHaveProperty('hiveId');
  expect(sent[0].body).toMatchObject({
    breeder: 'Hans Muster',
    line: 'Carnica',
    motherQueenId: MOTHER_ID,
    gentleness: 3,
    replacedAt: '2026-09-01T10:00:00.000Z',
  });
});
