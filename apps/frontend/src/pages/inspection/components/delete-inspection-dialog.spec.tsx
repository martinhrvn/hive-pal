import { test, expect } from '@playwright/test';

const STORY = 'pages/inspection/components/delete-inspection-dialog';
const BOX_AND_FRAMES = `${STORY}/BoxAndFrameChanges`;
const BOX_LOCKED = `${STORY}/BoxChangeLocked`;
const BOX_LOCKED_ONLY = `${STORY}/BoxChangeLockedOnly`;
const NO_CHANGES = `${STORY}/NoHiveChanges`;

// The dialog renders in a portal under <body>, so its locators hang off `page`.
test('lists the box and frame changes that undo reverts', async ({
  mount,
  page,
}) => {
  await mount(BOX_AND_FRAMES);

  const list = page.getByTestId('delete-inspection-undo-list');
  await expect(list.getByRole('listitem')).toHaveText([
    'Box configuration: +1 box added, +9 frames added',
    'Frames: −2 frames removed',
  ]);
  await expect(page.getByTestId('delete-inspection-box-locked')).toHaveCount(0);

  await page.getByTestId('delete-inspection-undo').click();
  await expect(page.getByTestId('last-delete')).toHaveText(
    '{"revertHiveChanges":true}',
  );
});

test('keeps the hive as is when asked to', async ({ mount, page }) => {
  await mount(BOX_AND_FRAMES);

  await page.getByTestId('delete-inspection-keep').click();
  await expect(page.getByTestId('last-delete')).toHaveText(
    '{"revertHiveChanges":false}',
  );
});

test('explains a box change that can no longer be undone', async ({
  mount,
  page,
}) => {
  await mount(BOX_LOCKED);

  await expect(
    page.getByTestId('delete-inspection-undo-list').getByRole('listitem'),
  ).toHaveText(['Frames: +2 frames added']);
  await expect(page.getByTestId('delete-inspection-box-locked')).toBeVisible();
});

test('falls back to a plain delete when nothing can be undone', async ({
  mount,
  page,
}) => {
  await mount(BOX_LOCKED_ONLY);

  await expect(page.getByTestId('delete-inspection-undo')).toHaveCount(0);
  await expect(page.getByTestId('delete-inspection-box-locked')).toBeVisible();

  await page.getByTestId('delete-inspection-confirm').click();
  await expect(page.getByTestId('last-delete')).toHaveText(
    '{"revertHiveChanges":false}',
  );
});

test('asks for a plain confirmation without hive changes', async ({
  mount,
  page,
}) => {
  await mount(NO_CHANGES);

  await expect(page.getByTestId('delete-inspection-undo-list')).toHaveCount(0);
  await expect(page.getByTestId('delete-inspection-box-locked')).toHaveCount(0);
  await expect(page.getByTestId('delete-inspection-confirm')).toBeVisible();
});
