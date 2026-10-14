import { expect, test, type Page } from '@playwright/test';
import { ActionsSectionPageObject } from 'page-objects';

// Pin the zone so local wall-clock times map to predictable ISO strings.
test.use({ timezoneId: 'UTC' });

const captureSavedDate = async (page: Page, method: 'POST' | 'PUT') => {
  const dates: string[] = [];
  await page.route('**/api/actions**', async route => {
    if (route.request().method() !== method) return route.fallback();
    const body = route.request().postDataJSON() as { date: string };
    dates.push(body.date);
    await route.fulfill({ json: { id: 'action-1', ...body } });
  });
  return dates;
};

const addNote = async (page: Page) => {
  await new ActionsSectionPageObject(page).selectAction('Note');
  await page.getByLabel('Note Content').fill('Added super');
  await page.getByRole('button', { name: 'Save Note' }).click();
};

const pickDay = async (page: Page, label: RegExp) => {
  await page
    .getByRole('button', { name: /June \d+(st|nd|rd|th), 2026/ })
    .click();
  await page.getByRole('button', { name: label }).click();
  await page.keyboard.press('Escape');
};

test.describe('Edit action dialog (#230)', () => {
  test('changing the date keeps the original time', async ({ page, mount }) => {
    const saved = await captureSavedDate(page, 'PUT');
    await mount(
      'pages/hive/hive-detail-page/actions/action-dialogs/EditNoteAction',
    );

    await pickDay(page, /June 12th, 2026/);
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect.poll(() => saved).toEqual(['2026-06-12T15:30:00.000Z']);
  });

  test('the time can be corrected', async ({ page, mount }) => {
    const saved = await captureSavedDate(page, 'PUT');
    await mount(
      'pages/hive/hive-detail-page/actions/action-dialogs/EditNoteAction',
    );

    await expect(page.getByLabel('Time')).toHaveValue('15:30');
    await page.getByLabel('Time').fill('08:15');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect.poll(() => saved).toEqual(['2026-06-10T08:15:00.000Z']);
  });
});

test.describe('Add action dialog (#230)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-06-10T17:45:00.000Z'));
  });

  test('picking a date keeps the current time', async ({ page, mount }) => {
    const saved = await captureSavedDate(page, 'POST');
    await mount('pages/hive/hive-detail-page/actions/action-dialogs/AddAction');

    await pickDay(page, /June 8th, 2026/);
    await addNote(page);
    await page.getByRole('button', { name: 'Save Actions' }).click();

    await expect.poll(() => saved).toEqual(['2026-06-08T17:45:00.000Z']);
  });

  test('the time can be set explicitly', async ({ page, mount }) => {
    const saved = await captureSavedDate(page, 'POST');
    await mount('pages/hive/hive-detail-page/actions/action-dialogs/AddAction');

    await page.getByLabel('Time').fill('06:05');
    await addNote(page);
    await page.getByRole('button', { name: 'Save Actions' }).click();

    await expect.poll(() => saved).toEqual(['2026-06-10T06:05:00.000Z']);
  });
});
