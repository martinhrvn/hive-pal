import { ReportsPage } from 'page-objects';
import { expect, test, uniqueName } from '../fixtures';

test.describe('Reports', { tag: ['@core'] }, () => {
  test('renders the overview, charts and trends tabs for the active apiary', async ({
    page,
    freshUser,
  }) => {
    const hive = await freshUser.api.createHive({
      name: uniqueName('Hive Greta'),
    });
    await freshUser.api.createInspection({
      hiveId: hive.id,
      notes: 'For the reports page',
    });

    const reports = new ReportsPage(page);
    await reports.goto();
    await expect(reports.selectApiaryHint).toHaveCount(0);
    await expect(reports.tab('Overview')).toBeVisible();
    await reports.tab('Charts').click();
    await expect(reports.tab('Charts')).toHaveAttribute('data-state', 'active');
    await reports.tab('Trends').click();
    await expect(page.getByText('Hive Score Trends')).toBeVisible();
  });
});
