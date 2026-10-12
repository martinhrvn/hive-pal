import { test, expect } from '@playwright/test';

test('walks through the split wizard and summarises the choices', async ({
  mount,
  page,
}) => {
  await mount('pages/hive/hive-detail-page/split/split-wizard/Default');

  // Step 1 — frames. Default is 3 of 10; the preview shows the mother at 7.
  await expect(page.getByText('How many brood frames to move?')).toBeVisible();
  await expect(page.getByText('of 10 frames')).toBeVisible();
  await page.screenshot({ path: 'test-results/split-wizard-step1.png' });

  // Advance to the summary — back-dating the split on the way (issue: splits
  // must not be locked to "today").
  await page.getByRole('button', { name: 'Next' }).click(); // -> New hive
  await expect(page.getByLabel('Name')).toHaveValue(/Volk 7 · Split/);
  await page.getByLabel('Date of split').fill('2026-07-14');
  // The suggested name follows the chosen date until manually edited.
  await expect(page.getByLabel('Name')).toHaveValue(
    'Volk 7 · Split 2026-07-14',
  );
  await page.getByRole('button', { name: 'Next' }).click(); // -> Queen
  await expect(page.getByText('Who keeps the queen?')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click(); // -> Confirm

  await expect(page.getByText('2026-07-14', { exact: true })).toBeVisible();
  await expect(page.getByText('3 brood frames')).toBeVisible();
  await expect(page.getByText('7 frames')).toBeVisible();
  await expect(page.getByText('stays with the mother')).toBeVisible();
  await expect(page.getByText('in 24 days')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Split colony' }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/split-wizard-summary.png' });
});

test('increasing the frame count updates the preview', async ({
  mount,
  page,
}) => {
  await mount('pages/hive/hive-detail-page/split/split-wizard/Default');

  // + once: 3 -> 4, so the mother goes 10 -> 6.
  await page.getByRole('button', { name: 'More frames' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('4 brood frames')).toBeVisible();
  await expect(page.getByText('6 frames')).toBeVisible();
});
