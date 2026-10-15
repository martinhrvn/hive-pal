import { test, expect } from '@playwright/test';

const STORY = 'components/hive/box-stack/Stack';

test('shows a placeholder when the hive has no boxes', async ({
  mount,
  page,
}) => {
  await mount(STORY, { count: 0 });

  await expect(page.getByText('No boxes')).toBeVisible();
});

test('draws the top box first and counts the boxes it leaves out', async ({
  mount,
  page,
}) => {
  await mount(STORY, { count: 6, size: 'minimap' });

  // Minimap shows three boxes, all honey supers from the top of the stack.
  await expect(page.getByText('H', { exact: true })).toHaveCount(3);
  await expect(page.getByText('B', { exact: true })).toHaveCount(0);
  await expect(page.getByText('+3 more')).toBeVisible();
});
