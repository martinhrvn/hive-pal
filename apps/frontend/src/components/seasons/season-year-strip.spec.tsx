import { test, expect } from '@playwright/test';

const DEFAULT = 'components/seasons/season-year-strip/Default';
const NO_SEASONS = 'components/seasons/season-year-strip/NoSeasons';
const NO_YEAR_ROUND =
  'components/seasons/season-year-strip/NoYearRoundInterval';

test('lays out seasons and the year-round gaps', async ({ mount }) => {
  const component = await mount(DEFAULT);

  // Winter wraps the year, so it is drawn at both ends.
  await expect(component.getByTestId('strip-season')).toHaveCount(4);
  await expect(component.getByTestId('strip-year-round')).toHaveCount(3);
});

test('summarises a season in a popover', async ({ mount, page }) => {
  const component = await mount(DEFAULT);

  await component.getByRole('button', { name: 'Spring build-up' }).click();
  const popover = page.getByTestId('strip-popover');
  await expect(popover).toContainText('Spring build-up');
  await expect(popover).toContainText('Inspect every 5 days');
  await expect(popover).toContainText('Now');
});

test('falls back to the year-round interval inside a season', async ({
  mount,
  page,
}) => {
  const component = await mount(DEFAULT);

  await component.getByRole('button', { name: 'Winter prep' }).click();
  const popover = page.getByTestId('strip-popover');
  await expect(popover).toContainText('Inspect every 10 days');
  await expect(popover).toContainText('(year-round)');
  await expect(popover).toContainText('Feed 12 kg sugar');
});

test('summarises the year-round days', async ({ mount, page }) => {
  const component = await mount(NO_SEASONS);

  await component.getByRole('button', { name: 'Year-round' }).click();
  await expect(page.getByTestId('strip-popover')).toContainText(
    'Inspect every 7 days',
  );
});

test('explains when hives keep their own interval', async ({ mount, page }) => {
  const component = await mount(NO_YEAR_ROUND);

  await component.getByRole('button', { name: 'Year-round' }).first().click();
  await expect(page.getByTestId('strip-popover')).toContainText(
    'Each hive uses its own inspection interval',
  );
});
