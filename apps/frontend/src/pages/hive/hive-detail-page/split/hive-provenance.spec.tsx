import { test, expect } from '@playwright/test';

test('shows the mother as a "split from" link', async ({ mount, page }) => {
  const component = await mount(
    'pages/hive/hive-detail-page/split/hive-provenance/WithMother',
  );

  await expect(page.getByText('Split from')).toBeVisible();
  const link = component.getByRole('link', { name: /Volk 3/ });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/hives/mother-9');
});

test('lists offspring hives with links', async ({ mount, page }) => {
  const component = await mount(
    'pages/hive/hive-detail-page/split/hive-provenance/WithOffspring',
  );

  await expect(page.getByText('Offspring')).toBeVisible();
  await expect(
    component.getByRole('link', { name: 'Ableger A' }),
  ).toHaveAttribute('href', '/hives/child-1');
  await expect(
    component.getByRole('link', { name: 'Ableger B' }),
  ).toHaveAttribute('href', '/hives/child-2');
});

test('renders nothing without provenance', async ({ mount }) => {
  const component = await mount(
    'pages/hive/hive-detail-page/split/hive-provenance/Empty',
  );

  await expect(component).toBeEmpty();
});
