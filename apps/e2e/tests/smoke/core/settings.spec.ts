import { UserSettingsPage } from 'page-objects';
import { expect, test } from '../fixtures';

test.describe('Settings', { tag: ['@core'] }, () => {
  test('changing the theme and saving shows the success toast', async ({
    page,
    freshUser,
  }) => {
    void freshUser;
    const settings = new UserSettingsPage(page);

    await test.step('open /settings', async () => {
      await settings.goto();
      await expect(settings.heading).toBeVisible();
      await expect(settings.themeSelect).toBeVisible();
    });

    await test.step('switch the theme to Dark', async () => {
      await settings.selectTheme('Dark');
      await expect(settings.themeSelect).toHaveText('Dark');
      await expect(page.locator('html')).toHaveClass(/dark/);
    });

    await test.step('save and see the confirmation toast', async () => {
      const saved = page.waitForResponse(
        res =>
          res.url().includes('/api/users/preferences') &&
          res.request().method() !== 'GET',
      );
      await settings.save();
      await saved;
      await expect(settings.savedToast).toBeVisible();
    });
  });
});
