import { test, expect } from '@playwright/test';

const STORY = 'components/seasons/season-list-field/Default';
const WITH_SEASON = 'components/seasons/season-list-field/WithSeason';

test('adds a feeding season and saves its target', async ({ mount }) => {
  const component = await mount(STORY);

  await component.getByTestId('add-season').click();
  await expect(component.getByTestId('season-card')).toHaveCount(1);

  await component.getByLabel('Name').fill('Winter prep');
  await component.getByRole('switch').click();
  await expect(component.getByLabel('Feeding target (kg sugar)')).toHaveValue(
    '12',
  );

  await component.getByRole('button', { name: 'Save' }).click();
  await expect(component.getByTestId('saved')).toContainText('Winter prep');
  await expect(component.getByTestId('saved')).toContainText('"enabled":true');
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
