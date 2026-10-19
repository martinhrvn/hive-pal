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
        await wizard.selectHive({ name: 'Hive 2' });
        await wizard.selectHive({ name: 'Hive 3' });
      },
      { target: wizard.hiveList },
    );
    await g.do('Enter how many frames came from each hive', async () => {
      await wizard.selectHive({ name: 'Hive 2', frames: 5 });
      await wizard.selectHive({ name: 'Hive 3', frames: 3 });
    });
    await expect(wizard.selectionSummary).toHaveText(
      'Selected: 2 hives • 8 total frames',
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
      'Counted wrong? Fix the frames while it’s a draft',
      () => detail.editHiveFrames('Hive 3', 4),
      { target: detail.editHivesButton },
    );
    await g.do(
      'Once extracted, weigh the honey and enter the total',
      () => detail.setWeight(18),
      { target: detail.setWeightButton },
    );
    await expect(detail.distributionRow('Hive 2')).toContainText('10.00 kg');
    await expect(detail.distributionRow('Hive 3')).toContainText('8.00 kg');
    await g.point(
      detail.distributionCard,
      'Hive Pal splits the weight between hives by frames',
    );
    await g.point(
      detail.readyToFinalizeAlert,
      'Until you finalize, you can still change anything',
    );
    await g.do(
      'Extracted more later? Update the weight',
      () => detail.editWeight(27),
      { target: detail.editWeightButton },
    );
    await expect(detail.distributionRow('Hive 2')).toContainText('15.00 kg');
    await expect(detail.distributionRow('Hive 3')).toContainText('12.00 kg');
    await g.point(detail.distributionCard, 'and the split follows along');
    await g.point(
      detail.finalizeButton,
      'All good? Finalize to log the honey on each hive',
    );
    const prompted = await g.do(
      'Finalize the harvest',
      () => detail.finalizeKeepingPrompt(),
      { target: detail.finalizeButton },
    );

    // -- Share: only on cloud, where finalizing offers to share ------------
    if (prompted) {
      await g.point(
        detail.sharePrompt,
        'Proud of your honey? Share it with fellow beekeepers',
      );
      await g.do('Let’s share it', () => detail.shareFromPrompt(), {
        target: detail.sharePromptShareButton,
      });
      const share = detail.shareDialog;
      await g.tour([
        [share.previewImage, 'Hive Pal makes a picture card of your harvest'],
        [
          share.linkInput,
          'Anyone with this link can see it, no account needed',
        ],
        [
          share.shareTargets,
          'Send it straight to Facebook or X, or save the image',
        ],
        [share.revokeButton, 'Changed your mind? Revoke the link at any time'],
      ]);
      await g.do('Close it when you’re done', () => share.close());
      await g.point(detail.shareButton, 'You can share it later from here too');
    } else if (await detail.shareButton.isVisible()) {
      await g.point(
        detail.shareButton,
        'Share your harvest with fellow beekeepers',
      );
    }

    // -- Configure: options worth knowing, without changing them -------------
    await g.point(
      detail.reopenButton,
      'Made a mistake? Reopen it to make changes',
    );
    await g.do('Now back to the overview', () => detail.backToList(), {
      target: detail.backButton,
    });

    await harvests.expectStat('Total Harvests', '2');
    await harvests.expectStat('Total Honey', '45.0 kg');
    await harvests.expectStat('Average Yield', '22.5 kg');
    await expect(harvests.historyRows).toHaveCount(2);
    await expect(harvests.historyRows.first()).toContainText('COMPLETED');
    await expect(harvests.historyRows.first()).toContainText('27.0 kg');
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
