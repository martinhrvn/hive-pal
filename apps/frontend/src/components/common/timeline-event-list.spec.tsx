import { test, expect } from '@playwright/test';

const STORY = 'components/common/timeline-event-list';
const WITH_DETAILS = `${STORY}/InspectionWithDetails`;
const WITHOUT_DETAILS = `${STORY}/InspectionWithoutDetails`;

test('shows the inspection notes on the row', async ({ mount }) => {
  const component = await mount(WITH_DETAILS);

  await expect(component).toContainText(
    'Colony is building up fast and has drawn out the whole second box.',
  );
});

test('expands the inspection details without opening it', async ({
  mount,
  page,
}) => {
  const component = await mount(WITH_DETAILS);

  await expect(component.getByText('Health Scores')).toHaveCount(0);

  await page.getByRole('button', { name: 'Show details' }).click();

  await expect(component.getByText('Health Scores')).toBeVisible();
  await expect(component.getByText('21°C')).toBeVisible();
  await expect(component.getByText('Partly Cloudy')).toBeVisible();
  await expect(component.getByText('Queen Cells')).toBeVisible();
  await expect(component.getByText('Brood Pattern: Solid')).toBeVisible();
  await expect(component.getByText('Swarm cells: Yes')).toBeVisible();
  await expect(component.getByText('Needs Super')).toBeVisible();
  await expect(
    component.getByRole('link', { name: 'Open inspection' }),
  ).toHaveAttribute(
    'href',
    '/inspections/22222222-2222-4222-8222-222222222222',
  );
  await expect(page.getByTestId('opened-inspection')).toHaveText('');

  await page.getByRole('button', { name: 'Hide details' }).click();
  await expect(component.getByText('Health Scores')).toHaveCount(0);
});

test('still opens the inspection when the row is clicked', async ({
  mount,
  page,
}) => {
  const component = await mount(WITH_DETAILS);

  await component.getByText('Inspection', { exact: true }).click();
  await expect(page.getByTestId('opened-inspection')).toHaveText(
    '22222222-2222-4222-8222-222222222222',
  );
});

test('offers nothing to expand when the inspection has no details', async ({
  mount,
  page,
}) => {
  await mount(WITHOUT_DETAILS);

  await expect(page.getByRole('button', { name: 'Show details' })).toHaveCount(
    0,
  );
});
