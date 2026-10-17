import { AppSidebar, HarvestDetailPage, HarvestListPage } from 'page-objects';
import { expect, test } from './guide.fixture';

test.describe('Guides', { tag: ['@guide'] }, () => {
  test('Recording a honey harvest', async ({ page, g, demo }) => {
    const sidebar = new AppSidebar(page);
    const harvests = new HarvestListPage(page);
    const wizard = harvests.wizard;
    const detail = new HarvestDetailPage(page);

    await page.goto('/');
    await expect(sidebar.nav('Harvests')).toBeVisible();

    // -- Show: where the page is and what the overview tells you -------------
    await g.chapter('Honey harvests', 'From frames to kilos, hive by hive');
    await g.point(
      sidebar.nav('Harvests'),
      'Harvests have their own page in the sidebar',
    );
    await g.do('Let’s open it', () => harvests.openFromSidebar(), {
      target: sidebar.nav('Harvests'),
    });

    await harvests.expectStat('Total Harvests', '1');
    await g.say('The cards at the top sum up your season at a glance');
    await g.tour([
      [
        harvests.totalHarvestsCard,
        'How many harvests you recorded, and how many are done',
      ],
      [harvests.totalYieldCard, 'All the honey from your completed harvests'],
      [harvests.averageYieldCard, 'What a harvest brings in on average'],
      [harvests.latestHarvestCard, 'Your most recent harvest and its weight'],
      [harvests.historyCard, 'Every harvest is listed below, newest first'],
    ]);

    // -- Do: record a harvest end to end -------------------------------------
    await g.chapter('Record a harvest');
    await g.do('Click “Start Harvest” to begin', () => wizard.open(), {
      target: harvests.startHarvestButton,
    });
    await g.point(
      wizard.dateButton,
      'It’s dated today. Click here to pick another day',
    );
    await g.do(
      'Tick the hives you took honey from',
      async () => {
        await wizard.selectHive({ name: 'Acacia' });
        await wizard.selectHive({ name: 'Meadow' });
      },
      { target: wizard.hiveList },
    );
    await g.do('Enter how many frames came from each hive', async () => {
      await wizard.selectHive({ name: 'Acacia', frames: 5 });
      await wizard.selectHive({ name: 'Meadow', frames: 3 });
    });
    await expect(wizard.selectionSummary).toHaveText(
      'Selected: 2 hive(s) • 8 total frames',
    );
    await g.point(wizard.selectionSummary, 'The summary keeps count for you');
    await g.do('Add a note if you like', () =>
      wizard.fillNotes('Summer linden flow'),
    );
    await g.do('Then start the harvest', () => wizard.submit(), {
      target: wizard.submitButton,
    });

    await detail.expectStatus('DRAFT');
    await g.point(detail.statusBadge, 'A new harvest starts as a draft');
    await g.point(
      detail.distributionCard,
      'Here are your hives and their frames',
    );
    await g.do(
      'Once extracted, weigh the honey and enter the total',
      () => detail.setWeight(16),
      { target: detail.setWeightButton },
    );
    await expect(detail.distributionRow('Acacia')).toContainText('10.00 kg');
    await expect(detail.distributionRow('Meadow')).toContainText('6.00 kg');
    await g.point(
      detail.distributionCard,
      'Hive Pal splits the weight between hives by frames',
    );
    await g.point(
      detail.finalizeButton,
      'All good? Finalize to log the honey on each hive',
    );
    await g.do('Finalize the harvest', () => detail.finalize(), {
      target: detail.finalizeButton,
    });

    // -- Configure: options worth knowing, without changing them -------------
    await g.point(
      detail.reopenButton,
      'Made a mistake? Reopen it to make changes',
    );
    await g.do('Now back to the overview', () => detail.backToList(), {
      target: detail.backButton,
    });

    await harvests.expectStat('Total Harvests', '2');
    await harvests.expectStat('Total Honey', '34.0 kg');
    await harvests.expectStat('Average Yield', '17.0 kg');
    await expect(harvests.historyRows).toHaveCount(2);
    await expect(harvests.historyRows.first()).toContainText('COMPLETED');
    await expect(harvests.historyRows.first()).toContainText('16.0 kg');
    await g.tour([
      [
        harvests.historyRows.first(),
        'Your new harvest is at the top of the list',
      ],
      [harvests.totalYieldCard, 'and the season totals are updated'],
    ]);
    await g.point(
      harvests.honeyColumnHeader,
      'Weights follow your unit setting. Switch to pounds in Settings',
    );
    await g.say('That’s it. Happy harvesting!');

    expect(demo.pastHarvest.weightKg).toBe(18);
  });
});
