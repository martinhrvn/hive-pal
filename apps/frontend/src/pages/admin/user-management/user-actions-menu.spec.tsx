import { test, expect } from '@playwright/test';

const story = (name: string) =>
  `pages/admin/user-management/user-actions-menu/${name}`;

test('offers every action for another active user', async ({ mount, page }) => {
  await mount(story('OtherUser'));
  await page.getByTestId('user-actions-trigger').click();

  for (const name of [
    'Reset password',
    'Make admin',
    'Ban user',
    'Delete user',
  ]) {
    await expect(page.getByRole('menuitem', { name })).toBeVisible();
  }
  await page.getByRole('menuitem', { name: 'Ban user' }).click();
  await expect(page.getByTestId('selected')).toHaveText('ban');
});

test('offers unban and admin removal for a banned admin', async ({
  mount,
  page,
}) => {
  await mount(story('BannedAdmin'));
  await page.getByTestId('user-actions-trigger').click();

  await expect(
    page.getByRole('menuitem', { name: 'Ban user', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('menuitem', { name: 'Remove admin role' }).click();
  await expect(page.getByTestId('selected')).toHaveText('toggleRole');
  await expect(page.getByRole('menu')).toHaveCount(0);

  await page.getByTestId('user-actions-trigger').click();
  await page.getByRole('menuitem', { name: 'Unban user' }).click();
  await expect(page.getByTestId('selected')).toHaveText('unban');
});

test('only offers a password reset on yourself', async ({ mount, page }) => {
  await mount(story('Self'));
  await page.getByTestId('user-actions-trigger').click();

  await expect(page.getByRole('menuitem')).toHaveCount(1);
  await expect(
    page.getByRole('menuitem', { name: 'Reset password' }),
  ).toBeVisible();
});
