import { test, expect } from '@playwright/test';

const DEFAULT = 'components/frame-sizes-card/Default';
const EMPTY = 'components/frame-sizes-card/Empty';

test('lists only the frame sizes the user created', async ({ mount }) => {
  const component = await mount(DEFAULT);

  const rows = component.getByTestId('frame-size-row');
  await expect(rows).toHaveCount(2);
  await expect(component.getByText('12x10')).toBeVisible();
  await expect(component.getByText('Danish shallow')).toBeVisible();

  // Built-in sizes and other beekeepers' sizes are not editable here.
  await expect(component.getByText('Langstroth Deep')).toHaveCount(0);
  await expect(component.getByText('NL 10')).toHaveCount(0);
});

test('shows dimensions and the review status of each size', async ({
  mount,
}) => {
  const component = await mount(DEFAULT);

  const rows = component.getByTestId('frame-size-row');
  await expect(rows.first()).toContainText('300 × 250 × 12 mm');
  await expect(rows.first()).toContainText('Shared');
  await expect(rows.nth(1)).toContainText('Pending review');
});

test('editing a size updates the row in place', async ({ mount, page }) => {
  const component = await mount(DEFAULT);

  // The edit dialog renders in a portal, so its locators hang off `page`.
  await page.getByTestId('edit-frame-size').first().click();
  await expect(page.getByTestId('frame-size-edit-name')).toHaveValue('12x10');

  await page.getByTestId('frame-size-edit-width').fill('310');
  await page.getByTestId('frame-size-edit-save').click();

  await expect(page.getByTestId('frame-size-edit-dialog')).toHaveCount(0);
  await expect(component.getByTestId('frame-size-row').first()).toContainText(
    '310 × 250 × 12 mm',
  );
});

test('explains how to add a size when there are none', async ({ mount }) => {
  const component = await mount(EMPTY);

  await expect(component.getByTestId('frame-size-row')).toHaveCount(0);
  await expect(component.getByText(/No custom frame sizes yet/)).toBeVisible();
});
