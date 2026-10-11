import { ApiarySwitcher, DashboardPage, HiveDetailPage } from 'page-objects';
import { DEFAULT_APIARY_NAME, expect, test, uniqueName } from '../fixtures';

/**
 * `/` — the dashboard for the active apiary: lists the hives of "My Apiary"
 * and opens a hive's detail page; shows the empty state when there are none.
 */
test.describe('Dashboard', { tag: ['@core'] }, () => {
  test('shows the active apiary with its hive and opens the hive detail', async ({
    page,
    freshUser,
  }) => {
    const hiveName = uniqueName('Dash Hive');
    await freshUser.api.createHive({ name: hiveName });

    const dashboard = new DashboardPage(page);
    const switcher = new ApiarySwitcher(page);
    const hiveDetail = new HiveDetailPage(page);

    await dashboard.goto();
    await expect(switcher.trigger).toContainText(DEFAULT_APIARY_NAME);
    await expect(dashboard.hive(hiveName)).toBeVisible();

    await dashboard.openHive(hiveName);
    await expect(page).toHaveURL(/\/hives\/[0-9a-f-]+$/);
    await expect(hiveDetail.heading(hiveName)).toBeVisible();
  });

  test('shows the empty state and links to hive creation when there are no hives', async ({
    page,
    freshUser: _freshUser,
  }) => {
    const dashboard = new DashboardPage(page);

    await dashboard.goto();
    await expect(dashboard.noHivesTitle).toBeVisible();
    await dashboard.addFirstHiveLink.click();
    await expect(page).toHaveURL(/\/hives\/create$/);
  });
});
