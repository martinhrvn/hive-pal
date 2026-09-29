import { test, expect } from './fixtures';
import { Page } from '@playwright/test';
import { generateRandomString } from './utils';

/**
 * The inspections table lets the user choose which columns are visible, and the
 * choice persists across reloads. This exercises the reusable column-visibility
 * system (useColumnVisibility + ColumnVisibilityMenu + DataTable).
 *
 * Run with: `BASE_URL=... pnpm --filter e2e test table-column-visibility`.
 */

// Seed one hive + one completed inspection through the API from the
// authenticated browser context, so the inspections table has a row to render.
const seedInspection = async (page: Page) => {
  return page.evaluate(async () => {
    const apiariesRes = await fetch('/api/apiaries', {
      credentials: 'include',
    });
    const apiaries = (await apiariesRes.json()) as {
      apiaries: Array<{ id: string }>;
    };
    const apiaryId = apiaries.apiaries[0].id;
    const headers = {
      'Content-Type': 'application/json',
      'x-apiary-id': apiaryId,
    };

    const hiveRes = await fetch('/api/hives', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ name: 'Column Test Hive', apiaryId }),
    });
    const hive = (await hiveRes.json()) as { id: string };

    await fetch('/api/inspections', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        hiveId: hive.id,
        date: new Date('2026-06-01T10:00:00.000Z').toISOString(),
        status: 'COMPLETED',
        notes: 'Colony looked strong and healthy with plenty of stores',
        actions: [
          {
            type: 'FEEDING',
            details: {
              type: 'FEEDING',
              feedType: 'Sugar syrup',
              amount: 2,
              unit: 'l',
            },
          },
          { type: 'FRAME', details: { type: 'FRAME', quantity: -3 } },
          { type: 'FRAME', details: { type: 'FRAME', quantity: 2 } },
        ],
      }),
    });
  });
};

test('inspections table columns can be hidden and the choice persists', async ({
  page,
}) => {
  await page.route('**/*', route => {
    const url = route.request().url();
    if (!url.startsWith('http://localhost:5173')) return route.abort();
    if (/\/api\/(weather|hivescale)/.test(url)) return route.abort();
    return route.continue();
  });

  // --- Register a fresh user (auto-creates a default apiary) ---
  const email = `columns-${Date.now()}@example.com`;
  const password = generateRandomString();
  await page.goto('/register', { waitUntil: 'commit' });
  await page.getByLabel('email').fill(email);
  await page
    .getByRole('textbox', { name: 'Password', exact: true })
    .fill(password);
  await page.getByRole('textbox', { name: 'Confirm Password' }).fill(password);
  await page.getByRole('textbox', { name: 'Display Name' }).fill('Columns');
  await page
    .getByRole('checkbox', { name: 'I agree to the Privacy Policy' })
    .click();
  await page.getByRole('button', { name: /register/i }).click();
  await page.waitForURL(u => !u.pathname.startsWith('/register'), {
    timeout: 15000,
  });
  await page.waitForLoadState('networkidle').catch(() => {});

  await seedInspection(page);

  // --- The inspections table shows the Weather column by default ---
  await page.goto('/inspections', { waitUntil: 'commit' });
  const weatherHeader = page.getByRole('columnheader', { name: 'Weather' });
  await expect(weatherHeader).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('columnheader', { name: 'Hive' })).toBeVisible();

  // --- The "Actions" column lists the performed actions (not a Details link) ---
  await expect(
    page.getByRole('columnheader', { name: 'Actions', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Feeding', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('Frames', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('×2').first()).toBeVisible();

  // --- Each row has leading View + Edit icon actions (the apiary owner can
  // edit, so both are present). These open the detail / edit routes. ---
  await expect(page.getByRole('button', { name: 'View' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit' }).first()).toBeVisible();

  // --- Hide the Weather column via the Columns menu ---
  const SHOT_DIR =
    process.env.SHOT_DIR ||
    '/tmp/claude-0/-home-user/d4f56f04-fc33-515b-bc80-dc0a3231b16e/scratchpad';
  await page.getByRole('button', { name: 'Columns', exact: true }).click();
  await expect(
    page.getByRole('menuitemcheckbox', { name: 'Weather' }),
  ).toBeVisible();
  await page.screenshot({
    path: `${SHOT_DIR}/columns-01-menu-open.png`,
    fullPage: true,
  });
  await page
    .getByRole('menuitemcheckbox', { name: 'Weather' })
    .click();
  await page.keyboard.press('Escape');

  await expect(weatherHeader).toHaveCount(0);
  await page.screenshot({
    path: `${SHOT_DIR}/columns-02-weather-hidden.png`,
    fullPage: true,
  });
  // Other columns are unaffected.
  await expect(page.getByRole('columnheader', { name: 'Hive' })).toBeVisible();

  // Persisted to localStorage under the table's key.
  const stored = await page.evaluate(() =>
    localStorage.getItem('hive_pal_table_columns:inspections'),
  );
  expect(stored).toContain('"weather":false');

  // --- The choice survives a reload ---
  await page.reload({ waitUntil: 'commit' });
  await expect(page.getByRole('columnheader', { name: 'Hive' })).toBeVisible({
    timeout: 15000,
  });
  await expect(
    page.getByRole('columnheader', { name: 'Weather' }),
  ).toHaveCount(0);

  // --- Re-enabling it brings the column back ---
  await page.getByRole('button', { name: 'Columns', exact: true }).click();
  await page
    .getByRole('menuitemcheckbox', { name: 'Weather' })
    .click();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('columnheader', { name: 'Weather' }),
  ).toBeVisible();

  // --- The Notes column is off by default and can be enabled ---
  await expect(
    page.getByRole('columnheader', { name: 'Notes' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Columns', exact: true }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Notes' }).click();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('columnheader', { name: 'Notes' }),
  ).toBeVisible();
  // The (abbreviated) note text is rendered in the row.
  await expect(
    page.getByText('Colony looked strong', { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: `${SHOT_DIR}/columns-03-notes-enabled.png`,
    fullPage: true,
  });
});
