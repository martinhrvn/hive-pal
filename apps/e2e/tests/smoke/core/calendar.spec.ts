import { CalendarPage } from 'page-objects';
import { expect, test, uniqueName } from '../fixtures';

test.describe('Calendar', { tag: ['@core'] }, () => {
  test('shows a scheduled inspection in the 7-day view', async ({
    page,
    freshUser,
  }) => {
    const hiveName = uniqueName('Hive Fiona');
    const hive = await freshUser.api.createHive({ name: hiveName });
    const tomorrowNoon = new Date();
    tomorrowNoon.setDate(tomorrowNoon.getDate() + 1);
    tomorrowNoon.setHours(12, 0, 0, 0);
    await freshUser.api.createInspection({
      hiveId: hive.id,
      status: 'SCHEDULED',
      date: tomorrowNoon.toISOString(),
    });

    const calendar = new CalendarPage(page);
    await calendar.goto();
    await expect(calendar.todayButton).toBeVisible();
    await calendar.todayButton.click();
    await expect(page.getByText(hiveName).first()).toBeVisible();
  });
});
