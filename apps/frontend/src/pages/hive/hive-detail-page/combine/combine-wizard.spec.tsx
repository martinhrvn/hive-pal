import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const HIVE_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_HIVE_ID = '44444444-4444-4444-8444-444444444444';
const OTHER_QUEEN_ID = '55555555-5555-4555-8555-555555555555';

const STORY = 'pages/hive/hive-detail-page/combine/combine-wizard/Default';

// Mocks the apiary hive list and captures the combine request.
async function mockApi(page: Page) {
  const combineCalls: { url: string; body: Record<string, unknown> }[] = [];
  // Match only real API calls: a '**/api/**' glob would also intercept vite
  // module requests such as /src/api/hooks/... and break the gallery load.
  await page.route(
    url => url.pathname.startsWith('/api/'),
    async route => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/combine')) {
        combineCalls.push({
          url: url.pathname,
          body: route.request().postDataJSON(),
        });
        return route.fulfill({
          json: {
            combineId: '66666666-6666-4666-8666-666666666666',
            survivorHiveId: HIVE_ID,
            absorbedHiveId: OTHER_HIVE_ID,
          },
        });
      }
      if (url.pathname === '/api/hives') {
        return route.fulfill({
          json: [
            { id: HIVE_ID, name: 'Volk 7', status: 'ACTIVE' },
            {
              id: OTHER_HIVE_ID,
              name: 'Volk 9',
              status: 'ACTIVE',
              activeQueen: { id: OTHER_QUEEN_ID, marking: 'Red 9' },
            },
            { id: 'archived', name: 'Old hive', status: 'ARCHIVED' },
          ],
        });
      }
      return route.fulfill({ json: [] });
    },
  );
  return combineCalls;
}

const pickOtherHive = async (page: Page) => {
  await page.getByLabel('Combine with').click();
  // Archived hives are not offered.
  await expect(page.getByRole('option', { name: 'Old hive' })).toHaveCount(0);
  await page.getByRole('option', { name: 'Volk 9' }).click();
};

test('combines the other hive into this one, keeping its queen', async ({
  mount,
  page,
}) => {
  const calls = await mockApi(page);
  await mount(STORY);

  await pickOtherHive(page);
  await expect(page.getByText('Which hive continues?')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click(); // -> Queen

  // Defaults to the survivor's queen; pick the absorbed hive's instead and
  // mark the other one as replaced.
  await expect(
    page.getByRole('button', { name: /Blue 7/, pressed: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Red 9/ }).click();
  await page.getByRole('button', { name: /^Replaced/ }).click();
  await page.getByRole('button', { name: 'Next' }).click(); // -> Details

  await page.getByLabel('Date of combine').fill('2026-07-14');
  await page.getByLabel('Move boxes onto the surviving hive').click();
  await page.getByRole('button', { name: 'Next' }).click(); // -> Confirm

  await expect(page.getByText('07/14/2026')).toBeVisible();
  await expect(page.getByText('Volk 9 (archived)')).toBeVisible();
  await expect(page.getByText('left as they are')).toBeVisible();
  await page.screenshot({ path: 'test-results/combine-wizard-summary.png' });

  await page.getByRole('button', { name: 'Combine colonies' }).click();
  await expect.poll(() => calls.length).toBe(1);
  expect(calls[0].url).toBe(`/api/hives/${HIVE_ID}/combine`);
  expect(calls[0].body).toMatchObject({
    absorbedHiveId: OTHER_HIVE_ID,
    keptQueenId: OTHER_QUEEN_ID,
    otherQueenFate: 'REPLACED',
    moveBoxes: false,
  });
});

test('lets the other hive survive and absorb this one', async ({
  mount,
  page,
}) => {
  const calls = await mockApi(page);
  await mount(STORY);

  await pickOtherHive(page);
  await page.getByRole('button', { name: /^Volk 9/ }).click();
  await page.getByRole('button', { name: 'Next' }).click(); // -> Queen
  await page.getByRole('button', { name: 'Next' }).click(); // -> Details
  await page.getByRole('button', { name: 'Next' }).click(); // -> Confirm
  await expect(page.getByText('Volk 7 (archived)')).toBeVisible();

  await page.getByRole('button', { name: 'Combine colonies' }).click();
  await expect.poll(() => calls.length).toBe(1);
  expect(calls[0].url).toBe(`/api/hives/${OTHER_HIVE_ID}/combine`);
  expect(calls[0].body).toMatchObject({
    absorbedHiveId: HIVE_ID,
    // The surviving hive's queen is kept by default; the other is removed.
    keptQueenId: OTHER_QUEEN_ID,
    otherQueenFate: 'DEAD',
    moveBoxes: true,
  });
});
