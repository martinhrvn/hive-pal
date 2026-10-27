import { test, expect } from '@playwright/test';

const STORY = 'components/seasons/season-list-field/Default';
const WITH_SEASON = 'components/seasons/season-list-field/WithSeason';

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

test('flags overlapping seasons', async ({ mount }) => {
  const component = await mount(WITH_SEASON);

  // The new season defaults to Mar-May, which overlaps the existing Spring.
  await component.getByTestId('add-season').click();
  await expect(component.getByTestId('season-overlap')).toBeVisible();
  // The unnamed new season is identified by its dates, not a stock name.
  await expect(component.getByTestId('season-overlap')).toContainText(
    '"Spring"',
  );
  await expect(component.getByTestId('season-overlap')).not.toContainText(
    'Autumn feeding',
  );
});

test('removes a season', async ({ mount }) => {
  const component = await mount(WITH_SEASON);

  await component.getByTestId('remove-season').click();
  await expect(component.getByTestId('season-card')).toHaveCount(0);
  await expect(component.getByText('No seasons yet')).toBeVisible();
});
