import { test, expect } from '@playwright/test';

const PENDING = 'components/frame-size-edit-dialog/Pending';
const SHARED = 'components/frame-size-edit-dialog/Shared';
const SAVE_FAILS = 'components/frame-size-edit-dialog/SaveFails';

// The dialog renders in a portal under <body>, so its locators hang off `page`
// rather than the mounted component.
test('opens prefilled and saves the edited values', async ({ mount, page }) => {
  await mount(PENDING);

  await page.getByTestId('open-dialog').click();

  const name = page.getByTestId('frame-size-edit-name');
  await expect(name).toHaveValue('12x10');
  await expect(page.getByTestId('frame-size-edit-width')).toHaveValue('300');

  await name.fill('12x10 DK');
  await page.getByTestId('frame-size-edit-width').fill('320');

  await page.getByTestId('frame-size-edit-save').click();

  const saved = page.getByTestId('last-save');
  await expect(saved).toContainText('"name":"12x10 DK"');
  await expect(saved).toContainText('"width":320');
  await expect(saved).toContainText('"height":250');
  await expect(saved).toContainText('"depth":12');
  await expect(page.getByTestId('frame-size-edit-dialog')).toHaveCount(0);
});

test('warns that an approved size is shared with other beekeepers', async ({
  mount,
  page,
}) => {
  await mount(SHARED);

  await page.getByTestId('open-dialog').click();

  await expect(page.getByTestId('frame-size-edit-shared-notice')).toBeVisible();
});

test('does not show the shared warning for a pending size', async ({
  mount,
  page,
}) => {
  await mount(PENDING);

  await page.getByTestId('open-dialog').click();

  await expect(page.getByTestId('frame-size-edit-shared-notice')).toHaveCount(
    0,
  );
});

test('keeps save disabled until name and dimensions are valid', async ({
  mount,
  page,
}) => {
  await mount(PENDING);

  await page.getByTestId('open-dialog').click();
  const save = page.getByTestId('frame-size-edit-save');
  await expect(save).toBeEnabled();

  await page.getByTestId('frame-size-edit-name').fill('x');
  await expect(save).toBeDisabled();

  await page.getByTestId('frame-size-edit-name').fill('Valid name');
  await expect(save).toBeEnabled();

  await page.getByTestId('frame-size-edit-width').fill('0');
  await expect(save).toBeDisabled();

  await page.getByTestId('frame-size-edit-width').fill('');
  await expect(save).toBeDisabled();

  await page.getByTestId('frame-size-edit-width').fill('300');
  await page.getByTestId('frame-size-edit-depth').fill('-2');
  await expect(save).toBeDisabled();
});

test('accepts a decimal comma in dimensions', async ({ mount, page }) => {
  await mount(PENDING);

  await page.getByTestId('open-dialog').click();
  await page.getByTestId('frame-size-edit-depth').fill('12,5');
  await page.getByTestId('frame-size-edit-save').click();

  await expect(page.getByTestId('last-save')).toContainText('"depth":12.5');
});

test('stays open when the save is rejected', async ({ mount, page }) => {
  await mount(SAVE_FAILS);

  await page.getByTestId('open-dialog').click();
  await page.getByTestId('frame-size-edit-width').fill('310');
  await page.getByTestId('frame-size-edit-save').click();

  await expect(page.getByTestId('frame-size-edit-dialog')).toBeVisible();
  await expect(page.getByTestId('frame-size-edit-width')).toHaveValue('310');
  await expect(page.getByTestId('last-save')).toBeEmpty();
});
