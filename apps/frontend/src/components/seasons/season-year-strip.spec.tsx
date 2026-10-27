import { test, expect } from '@playwright/test';

const DEFAULT = 'components/seasons/season-year-strip/Default';
const NO_SEASONS = 'components/seasons/season-year-strip/NoSeasons';
const NO_YEAR_ROUND =
  'components/seasons/season-year-strip/NoYearRoundInterval';
const EDITABLE = 'components/seasons/season-year-strip/Editable';
const WINTER_GAP = 'components/seasons/season-year-strip/EditableWinterGap';

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

test('opens a season for editing from the strip', async ({ mount }) => {
  const component = await mount(EDITABLE);

  // Exact: the season's list row is a button whose name includes it too.
  await component
    .getByRole('button', { name: 'Spring build-up', exact: true })
    .click();
  await expect(component.getByRole('textbox', { name: 'Name' })).toHaveValue(
    'Spring build-up',
  );
});

test('adds a season by clicking a year-round gap', async ({ mount }) => {
  const component = await mount(EDITABLE);

  await component.getByTestId('strip-year-round').first().click();
  await expect(component.getByTestId('season-card')).toHaveCount(4);
  await expect(component.getByRole('textbox', { name: 'Name' })).toHaveCount(1);
});

test('deletes a season from the strip menu', async ({ mount, page }) => {
  const component = await mount(EDITABLE);

  await component.getByTestId('strip-season-more').first().click();
  await page
    .locator('[data-slot="popover-content"]')
    .getByRole('button', { name: 'Remove season' })
    .click();
  await expect(component.getByTestId('season-card')).toHaveCount(2);
});

test('adds one season across the new year from either end', async ({
  mount,
}) => {
  const component = await mount(WINTER_GAP);

  // Jan – Feb half of the Oct – Feb gap.
  await component.getByTestId('strip-year-round').first().click();
  await expect(component.getByTestId('season-card')).toHaveCount(3);
  // The new season wraps the year, so it covers both ends of the strip.
  await expect(component.getByTestId('strip-year-round')).toHaveCount(1);
});

test('keys the colours by what each season does', async ({ mount }) => {
  const component = await mount(
    'components/seasons/season-year-strip/AllRoles',
  );

  const key = component.getByTestId('strip-key');
  await expect(key).toContainText('Inspections');
  await expect(key).toContainText('Feeding');
  await expect(key).toContainText('No inspections');
  await expect(key).toContainText('Year-round');
  await expect(key).toContainText('One inspection');
});

test('dims the rest of the year while a season is open', async ({ mount }) => {
  const component = await mount(EDITABLE);

  await component
    .getByRole('button', { name: 'Spring build-up', exact: true })
    .click();
  await expect(
    component.getByRole('button', { name: 'Winter prep', exact: true }),
  ).toHaveClass(/opacity-50/);
  await expect(
    component.getByRole('button', { name: 'Spring build-up', exact: true }),
  ).not.toHaveClass(/opacity-50/);
});

test('keeps one season open at a time', async ({ mount }) => {
  const component = await mount(EDITABLE);

  await component
    .getByRole('button', { name: 'Spring build-up', exact: true })
    .click();
  // Opening another season, from its row this time, closes the first.
  await component
    .getByTestId('edit-season')
    .filter({ hasText: 'Winter prep' })
    .click();
  const name = component.getByRole('textbox', { name: 'Name' });
  await expect(name).toHaveCount(1);
  await expect(name).toHaveValue('Winter prep');
});
