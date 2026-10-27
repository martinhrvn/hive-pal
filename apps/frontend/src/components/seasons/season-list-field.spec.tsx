import { test, expect } from '@playwright/test';

const STORY = 'components/seasons/season-list-field/Default';
const WITH_SEASON = 'components/seasons/season-list-field/WithSeason';
const WITH_NEIGHBOURS = 'components/seasons/season-list-field/WithNeighbours';
const OVERLAPPING = 'components/seasons/season-list-field/Overlapping';

test('adds a feeding season and saves its target', async ({ mount }) => {
  const component = await mount(STORY);

  await component.getByTestId('add-season').click();
  await expect(component.getByTestId('season-card')).toHaveCount(1);

  await component.getByLabel('Name').fill('Winter prep');
  await component.getByTestId('season-feeding').click();
  await expect(component.getByLabel('Feeding target (kg sugar)')).toHaveValue(
    '12',
  );

  await component.getByRole('button', { name: 'Save' }).click();
  await expect(component.getByTestId('saved')).toContainText('Winter prep');
  await expect(component.getByTestId('saved')).toContainText('"enabled":true');

  // Saving keeps the editor open; "Done" collapses it to a summary row.
  await expect(component.getByLabel('Name')).toHaveCount(1);
  await component.getByTestId('done-season').click();
  await expect(component.getByLabel('Name')).toHaveCount(0);
  await expect(component.getByTestId('season-card')).toContainText(
    'Feed 12 kg sugar',
  );
});

test('shows a saved season as a summary until edited', async ({ mount }) => {
  const component = await mount(WITH_SEASON);
  const card = component.getByTestId('season-card');

  await expect(card).toContainText('Spring');
  await expect(card).toContainText('Inspect every 5 days');
  await expect(component.getByLabel('Name')).toHaveCount(0);

  await component.getByTestId('edit-season').click();
  await component.getByLabel('Name').fill('Early spring');
  // "Done" collapses the editor and keeps the edits.
  await component.getByTestId('done-season').click();
  await expect(component.getByLabel('Name')).toHaveCount(0);
  await expect(card).toContainText('Early spring');

  await component.getByRole('button', { name: 'Save' }).click();
  await expect(component.getByTestId('saved')).toContainText('Early spring');
});

test('saves a season without inspections', async ({ mount }) => {
  const component = await mount(WITH_SEASON);

  await component.getByTestId('edit-season').click();
  await expect(
    component.getByLabel('Inspection interval (days)'),
  ).toBeVisible();
  await component.getByTestId('season-inspections').click();
  await expect(component.getByLabel('Inspection interval (days)')).toHaveCount(
    0,
  );

  await component.getByRole('button', { name: 'Save' }).click();
  await expect(component.getByTestId('saved')).toContainText(
    '"inspectionsPaused":true',
  );
  await expect(component.getByTestId('saved')).toContainText(
    '"inspectionFrequencyDays":null',
  );

  await component.getByTestId('done-season').click();
  await expect(component.getByTestId('season-card')).toContainText(
    'No inspections',
  );
});

test('shows which days overlap and opens the season to fix', async ({
  mount,
  page,
}) => {
  const component = await mount(OVERLAPPING);
  const alert = component.getByTestId('season-overlap');

  // The unnamed season is identified by its dates, not a stock name.
  await expect(alert).toContainText('"Spring"');
  await expect(alert).toContainText('both cover May 15 – May 31');
  await expect(alert).not.toContainText('Autumn feeding');

  await component.getByTestId('edit-overlapping-season').click();
  await expect(component.getByLabel('Starts')).toHaveText('May 15');
  // The days spring holds would cut it in two, so start after it instead.
  await component.getByLabel('Starts').click();
  await page.getByRole('button', { name: /next month/i }).click();
  await page
    .getByRole('grid')
    .getByRole('button', { name: /June 1st/ })
    .click();
  await expect(alert).toHaveCount(0);
});

test('adds a season in the longest free stretch', async ({ mount }) => {
  const component = await mount(WITH_SEASON);

  await component.getByTestId('add-season').click();
  await expect(component.getByLabel('Starts')).toHaveText('June 1');
  await expect(component.getByLabel('Ends')).toHaveText('February 29');
  await expect(component.getByTestId('season-overlap')).toHaveCount(0);
});

test('shortens the next season to make room, with an undo', async ({
  mount,
  page,
}) => {
  const component = await mount(WITH_NEIGHBOURS);

  await component.getByTestId('edit-season').first().click();
  await component.getByLabel('Ends').click();
  await expect(
    page.getByText('Dotted days belong to another season'),
  ).toBeVisible();
  await page.getByRole('button', { name: /next month/i }).click();
  await page
    .getByRole('grid')
    .getByRole('button', { name: /June 15th/ })
    .click();

  const note = component.getByTestId('season-shortened');
  await expect(note).toContainText('Shortened "Summer" to Jun 16 – Aug 31.');
  await expect(component.getByLabel('Ends')).toHaveText('June 15');
  await expect(component.getByTestId('season-overlap')).toHaveCount(0);

  await component.getByTestId('undo-shortened').click();
  await expect(note).toHaveCount(0);
  await expect(component.getByLabel('Ends')).toHaveText('May 31');
  await expect(component.getByTestId('season-card').nth(1)).toContainText(
    'Jun 1 – Aug 31',
  );
});

test('blocks days that would swallow another season', async ({
  mount,
  page,
}) => {
  const component = await mount(WITH_NEIGHBOURS);

  await component.getByTestId('edit-season').first().click();
  await component.getByLabel('Ends').click();
  const next = page.getByRole('button', { name: /next month/i });
  for (let step = 0; step < 4; step += 1) await next.click();
  // Spring ending in September would cover all of summer.
  await expect(page.getByText('September', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('grid').getByRole('button', { name: /September 10th/ }),
  ).toBeDisabled();
});

test('removes a season', async ({ mount }) => {
  const component = await mount(WITH_SEASON);

  await component.getByTestId('remove-season').click();
  await expect(component.getByTestId('season-card')).toHaveCount(0);
  await expect(component.getByText('No seasons yet')).toBeVisible();
});

test('picks a start day from a calendar of the year', async ({
  mount,
  page,
}) => {
  const component = await mount(WITH_SEASON);

  await component.getByTestId('edit-season').click();
  const starts = component.getByLabel('Starts');
  await expect(starts).toHaveText('March 1');

  // The calendar opens on the current start and has no year or weekdays.
  await starts.click();
  const calendar = page.getByRole('grid');
  await expect(page.getByText('March', { exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader')).toHaveCount(0);
  await calendar.getByRole('button', { name: /15/ }).click();

  await expect(calendar).toHaveCount(0);
  await expect(starts).toHaveText('March 15');

  await component.getByRole('button', { name: 'Save' }).click();
  await expect(component.getByTestId('saved')).toContainText(
    '"start":{"month":3,"day":15}',
  );
});
