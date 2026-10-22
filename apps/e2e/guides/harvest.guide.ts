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
    await g.chapter('Honey harvests', 'From frames to kilos, hive by hive', {
      voiceover:
        'Welcome to Hive Pal. In this guide, we’ll follow a honey harvest from the frames you pull to the kilos on each hive.',
    });
    await g.point(
      sidebar.nav('Harvests'),
      'Harvests have their own page in the sidebar',
      { voiceover: 'Harvests have their own page, right here in the sidebar.' },
    );
    await g.do('Let’s open it', () => harvests.openFromSidebar(), {
      target: sidebar.nav('Harvests'),
      voiceover: 'Let’s open it and take a look.',
    });

    await harvests.expectStat('Total Harvests', '1');
    await g.say('The cards at the top sum up your season at a glance', {
      voiceover: 'At the top, a row of cards sums up your season at a glance.',
    });
    await g.tour([
      [
        harvests.totalHarvestsCard,
        'How many harvests you recorded, and how many are done',
        {
          voiceover:
            'The first one counts the harvests you’ve recorded, and how many of them are finished.',
        },
      ],
      [
        harvests.totalYieldCard,
        'All the honey from your completed harvests',
        {
          voiceover:
            'Next to it is all the honey from your completed harvests, added up.',
        },
      ],
      [
        harvests.averageYieldCard,
        'What a harvest brings in on average',
        { voiceover: 'This one shows what a harvest brings in on average,' },
      ],
      [
        harvests.latestHarvestCard,
        'Your most recent harvest and its weight',
        { voiceover: 'and here’s your most recent harvest, with its weight.' },
      ],
      [
        harvests.historyCard,
        'Every harvest is listed below, newest first',
        {
          voiceover:
            'Below the cards, every harvest is listed, with the newest at the top.',
        },
      ],
    ]);

    // -- Do: record a harvest end to end -------------------------------------
    await g.chapter('Record a harvest', undefined, {
      voiceover: 'Now let’s record a new harvest, step by step.',
    });
    await g.do('Click “Start Harvest” to begin', () => wizard.open(), {
      target: harvests.startHarvestButton,
      voiceover: 'To begin, click Start Harvest.',
    });
    await g.point(
      wizard.dateButton,
      'It’s dated today. Click here to pick another day',
      {
        voiceover:
          'The harvest is dated today. If you took the honey off on another day, click the date and pick the right one.',
      },
    );
    await g.do(
      'Tick the hives you took honey from',
      async () => {
        await wizard.selectHive({ name: 'Hive 2' });
        await wizard.selectHive({ name: 'Hive 3' });
      },
      {
        target: wizard.hiveList,
        voiceover:
          'Next, tick the hives you took honey from. Today, that’s Hive 2 and Hive 3.',
      },
    );
    await g.do(
      'Enter how many frames came from each hive',
      async () => {
        await wizard.selectHive({ name: 'Hive 2', frames: 5 });
        await wizard.selectHive({ name: 'Hive 3', frames: 3 });
      },
      {
        voiceover:
          'For each hive, enter how many frames you pulled: five from Hive 2, and three from Hive 3.',
      },
    );
    await expect(wizard.selectionSummary).toHaveText(
      'Selected: 2 hives • 8 total frames',
    );
    await g.point(wizard.selectionSummary, 'The summary keeps count for you', {
      voiceover:
        'The summary keeps count for you: two hives, eight frames in total.',
    });
    await g.do(
      'Add a note if you like',
      () => wizard.fillNotes('Summer linden flow'),
      {
        voiceover:
          'You can add a note too, like which flow the honey came from.',
      },
    );
    await g.do('Then start the harvest', () => wizard.submit(), {
      target: wizard.submitButton,
      voiceover: 'When everything looks right, start the harvest.',
    });

    await detail.expectStatus('DRAFT');
    await g.point(detail.statusBadge, 'A new harvest starts as a draft', {
      voiceover:
        'A new harvest starts out as a draft, so nothing is set in stone yet.',
    });
    await g.point(
      detail.distributionCard,
      'Here are your hives and their frames',
      { voiceover: 'Here are the hives you picked, with their frames.' },
    );
    await g.do(
      'Counted wrong? Fix the frames while it’s a draft',
      () => detail.editHiveFrames('Hive 3', 4),
      {
        target: detail.editHivesButton,
        voiceover:
          'Counted wrong? While it’s a draft, you can still fix the frames. Let’s change Hive 3 to four.',
      },
    );
    await g.do(
      'Once extracted, weigh the honey and enter the total',
      () => detail.setWeight(18),
      {
        target: detail.setWeightButton,
        voiceover:
          'Once the honey is extracted, weigh it and enter the total. Here, that’s eighteen kilos.',
      },
    );
    await expect(detail.distributionRow('Hive 2')).toContainText('10.00 kg');
    await expect(detail.distributionRow('Hive 3')).toContainText('8.00 kg');
    await g.point(
      detail.distributionCard,
      'Hive Pal splits the weight between hives by frames',
      {
        voiceover:
          'Hive Pal then splits the weight between the hives, by how many frames each one gave.',
      },
    );
    await g.point(
      detail.readyToFinalizeAlert,
      'Until you finalize, you can still change anything',
      {
        voiceover:
          'Until you finalize the harvest, you can still change anything.',
      },
    );
    await g.do(
      'Extracted more later? Update the weight',
      () => detail.editWeight(27),
      {
        target: detail.editWeightButton,
        voiceover:
          'Say you extracted a few more frames later. Just update the weight, to twenty-seven kilos,',
      },
    );
    await expect(detail.distributionRow('Hive 2')).toContainText('15.00 kg');
    await expect(detail.distributionRow('Hive 3')).toContainText('12.00 kg');
    await g.point(detail.distributionCard, 'and the split follows along', {
      voiceover: 'and the split between the hives follows along.',
    });
    await g.point(
      detail.finalizeButton,
      'All good? Finalize to log the honey on each hive',
      {
        voiceover:
          'When it’s all correct, finalize the harvest. That logs the honey on each hive’s record.',
      },
    );
    const prompted = await g.do(
      'Finalize the harvest',
      () => detail.finalizeKeepingPrompt(),
      { target: detail.finalizeButton, voiceover: 'Let’s finalize it.' },
    );

    // -- Share: only on cloud, where finalizing offers to share ------------
    if (prompted) {
      await g.point(
        detail.sharePrompt,
        'Proud of your honey? Share it with fellow beekeepers',
        {
          voiceover:
            'Proud of your honey? Hive Pal offers to share it with fellow beekeepers.',
        },
      );
      await g.do('Let’s share it', () => detail.shareFromPrompt(), {
        target: detail.sharePromptShareButton,
      });
      const share = detail.shareDialog;
      await g.tour([
        [
          share.previewImage,
          'Hive Pal makes a picture card of your harvest',
          { voiceover: 'It makes a picture card of your harvest,' },
        ],
        [
          share.linkInput,
          'Anyone with this link can see it, no account needed',
          {
            voiceover: 'and a link that anyone can open, no account needed.',
          },
        ],
        [
          share.shareTargets,
          'Send it straight to Facebook or X, or save the image',
          {
            voiceover:
              'You can send it straight to Facebook or X, or save the image.',
          },
        ],
        [
          share.revokeButton,
          'Changed your mind? Revoke the link at any time',
          {
            voiceover:
              'And if you change your mind, you can revoke the link at any time.',
          },
        ],
      ]);
      await g.do('Close it when you’re done', () => share.close());
      await g.point(
        detail.shareButton,
        'You can share it later from here too',
        { voiceover: 'You can always share it later from this button.' },
      );
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
      {
        voiceover:
          'And if you spot a mistake after finalizing, reopen the harvest to make changes.',
      },
    );
    await g.do('Now back to the overview', () => detail.backToList(), {
      target: detail.backButton,
      voiceover: 'Now let’s head back to the overview.',
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
        { voiceover: 'Your new harvest is right at the top of the list,' },
      ],
      [
        harvests.totalYieldCard,
        'and the season totals are updated',
        { voiceover: 'and the season totals have been updated.' },
      ],
    ]);
    await g.point(
      harvests.honeyColumnHeader,
      'Weights follow your unit setting. Switch to pounds in Settings',
      {
        voiceover:
          'Weights follow your unit setting, so if you prefer pounds, you can switch in Settings.',
      },
    );
    await g.say('That’s it. Happy harvesting!', {
      voiceover: 'And that’s it. Happy harvesting!',
    });

    expect(demo.pastHarvest.weightKg).toBe(18);
  });
});
