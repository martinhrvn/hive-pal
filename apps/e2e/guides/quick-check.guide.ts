import { DashboardPage, QuickCheckDialog } from 'page-objects';
import { expect, GUIDE_MODE, test } from './guide.fixture';

const NOTE = 'Brood on 6 frames, lots of fresh nectar';

// A short: one task, portrait, about a minute. CI runs it as a plain test on
// desktop; it is only recorded in the mobile pass.
test.describe('Guides', { tag: ['@guide'] }, () => {
  test('Quick check at the hive', async ({ page, g, demo }, testInfo) => {
    test.skip(
      GUIDE_MODE && testInfo.project.name !== 'guides-mobile',
      'short: recorded in the mobile pass only',
    );
    const dashboard = new DashboardPage(page);
    const quickCheck = new QuickCheckDialog(page);

    await page.goto('/');
    await expect(dashboard.hive('Hive 1')).toBeVisible();

    await g.intro('Quick check', 'Log what you saw in seconds');
    await g.do(
      'At the hive? Open it on your phone',
      async () => {
        await dashboard.openHive('Hive 1');
        await page.waitForURL(`**/hives/${demo.hives['Hive 1'].id}`);
      },
      { target: dashboard.hive('Hive 1') },
    );
    await g.do('Tap “Add Entry”, then “Quick Check”', () => quickCheck.open(), {
      target: quickCheck.addEntryButton,
    });
    await g.do('Tap what you see', () =>
      quickCheck.toggleTags('Calm', 'Healthy'),
    );
    await g.do(
      'and anything to come back to',
      () => quickCheck.toggleTags('Needs Super'),
      { target: quickCheck.reminderTags },
    );
    await g.do('Add a note if you like', () => quickCheck.fillNote(NOTE));
    await g.do('Save', () => quickCheck.save(), {
      target: quickCheck.saveButton,
    });

    await expect(quickCheck.timelineEntry(NOTE)).toBeVisible();
    await g.point(
      quickCheck.timelineEntry(NOTE),
      'It’s on the hive’s timeline, next to your inspections',
    );
    await g.say('No full inspection needed. Tap, save, back to the bees');
  });
});
