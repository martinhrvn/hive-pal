import { ScheduleInspectionPage } from 'page-objects';
import { expect, test, uniqueName } from '../fixtures';

test.describe('Schedule inspection', { tag: ['@core'] }, () => {
  test('schedules an inspection for today and lists it under Upcoming', async ({
    page,
    freshUser,
  }) => {
    const hiveName = uniqueName('Hive Emma');
    await freshUser.api.createHive({ name: hiveName });

    const schedule = new ScheduleInspectionPage(page);

    await schedule.goto();
    await expect(schedule.heading).toBeVisible();
    await schedule.selectHive(hiveName);
    // The apiary has no coordinates, so the day grid renders without weather.
    await schedule.pickToday();
    await expect(schedule.submitButton).toHaveText('Schedule 1 Inspection');
    await schedule.submitButton.click();

    await expect(page).toHaveURL(/\/inspections\/list\/upcoming$/);
    // Upcoming renders scheduled inspections as cards grouped by day, not as table rows.
    await expect(
      page.getByRole('heading', { name: /Today's Inspections \(1\)/ }),
    ).toBeVisible();
    await expect(page.getByText(hiveName).first()).toBeVisible();
  });
});
