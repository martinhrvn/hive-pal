import { test, expect } from '@playwright/experimental-ct-react';
import { MemoryRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { HiveForm } from './hive-form';
import type { Page } from '@playwright/test';

const APIARY_ID = '11111111-1111-4111-8111-111111111111';
const HIVE_ID = '22222222-2222-4222-8222-222222222222';

// Regression tests for the silently-dead save button: validation failures on
// unrendered form fields (e.g. a hive status outside ACTIVE/INACTIVE) used to
// abort the submit with no request and no visible error.
async function mockApi(page: Page, requests: string[], settings: unknown) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    requests.push(`${route.request().method()} ${url.pathname}`);
    if (url.pathname === '/api/apiaries') {
      return route.fulfill({
        json: {
          apiaries: [
            { id: APIARY_ID, name: 'Home Apiary', role: 'OWNER', settings: {} },
          ],
          pendingMemberships: 0,
        },
      });
    }
    if (url.pathname === `/api/hives/${HIVE_ID}`) {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({
          json: {
            id: HIVE_ID,
            name: 'Volk 7',
            apiaryId: APIARY_ID,
            status: 'UNKNOWN',
            updatedAt: '2026-07-21T12:00:00.000Z',
          },
        });
      }
      return route.fulfill({
        json: {
          id: HIVE_ID,
          name: 'Volk 7',
          apiaryId: APIARY_ID,
          status: 'UNKNOWN',
          installationDate: '2025-04-12T10:00:00.000Z',
          updatedAt: '2026-07-14T09:00:00.000Z',
          settings,
          boxes: [],
          alerts: [],
          hiveScore: null,
          activeQueen: null,
        },
      });
    }
    return route.fulfill({ json: [] });
  });
}

test('saving a hive with a non-ACTIVE status sends the update', async ({
  mount,
  page,
}) => {
  const requests: string[] = [];
  await mockApi(page, requests, {});

  await mount(
    <MemoryRouter>
      <HiveForm hiveId={HIVE_ID} />
    </MemoryRouter>,
  );

  // Wait for the hive to load into the form.
  await expect(page.getByPlaceholder('hive 01')).toHaveValue('Volk 7');

  // The submit button is labeled "Save" (not the page title).
  const save = page.getByRole('button', { name: 'Save', exact: true });
  await save.click();

  // The update request actually goes out (used to be silently swallowed).
  await expect
    .poll(() =>
      requests.filter((r) => r === `PATCH /api/hives/${HIVE_ID}`),
    )
    .toHaveLength(1);
});

test('a validation failure on a hidden field shows a named error', async ({
  mount,
  page,
}) => {
  const requests: string[] = [];
  // amountKg 0 violates the settings schema on a field that is not rendered —
  // previously this made the save button silently dead.
  await mockApi(page, requests, {
    autumnFeeding: { startMonth: 8, endMonth: 10, amountKg: 0 },
  });

  await mount(
    <MemoryRouter>
      <>
        <HiveForm hiveId={HIVE_ID} />
        <Toaster />
      </>
    </MemoryRouter>,
  );
  await expect(page.getByPlaceholder('hive 01')).toHaveValue('Volk 7');

  await page.getByRole('button', { name: 'Save', exact: true }).click();

  // Instead of a silent no-op, the user sees which field is at fault…
  await expect(page.getByText('Cannot save — please check')).toBeVisible();
  // …and no update was sent.
  expect(
    requests.filter((r) => r === `PATCH /api/hives/${HIVE_ID}`),
  ).toHaveLength(0);
});
