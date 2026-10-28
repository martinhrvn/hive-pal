import {
  ApiaryDetailPage,
  DashboardPage,
  HiveDetailPage,
  SeasonsEditorPageObject,
} from 'page-objects';
import { expect, test } from './guide.fixture';

// A feature summary for the seasons release: no intro or outro cards on
// purpose, so the video opens and closes on the app. The cards can be added
// once the release framing is decided.
test.describe('Guides', { tag: ['@guide'] }, () => {
  test('Seasons: one schedule for the apiary and its hives', async ({
    page,
    g,
    demo,
  }) => {
    const apiary = new ApiaryDetailPage(page);
    const dashboard = new DashboardPage(page);
    const hive = new HiveDetailPage(page);
    const seasons = new SeasonsEditorPageObject(page);

    // Recording starts at the first cue below, so the Seasons tab is already
    // open on the video's first frame.
    await apiary.goto(demo.user.apiaryId);
    // Recording defaults to preview, which has no seasons until this branch is
    // deployed. Say so instead of failing on a click timeout.
    await expect(
      apiary.tab('Seasons'),
      'No Seasons tab here: record with BASE_URL=http://localhost:5173 until the seasons branch is on preview.',
    ).toBeVisible();
    await apiary.tab('Seasons').click();
    await expect(seasons.yearStrip).toBeVisible();

    // -- Show: the apiary's year ---------------------------------------------
    await g.say('Plan the year once, and every hive follows it', {
      voiceover:
        'Hive Pal seasons let you plan the whole year once, and every hive in the apiary follows the same plan.',
    });
    await g.point(
      seasons.description,
      'The apiary’s own schedule, shared by its hives',
      {
        voiceover:
          'This is the apiary’s own schedule. Its hives inherit it, until one needs something different.',
      },
    );
    await g.point(seasons.yearStrip, 'The whole year, at a glance', {
      voiceover:
        'The strip at the top is the whole year. Each season is a block of colour, and the line marks today.',
    });
    await g.tour([
      [
        seasons.stripSeason('Spring build-up'),
        'Spring build-up: inspections every five days',
        {
          voiceover:
            'Here’s spring build-up, when the colony grows fast, so it is checked every five days.',
        },
      ],
      [
        seasons.stripSeason('Autumn feeding'),
        'Autumn feeding: twelve kilos of sugar to feed',
        {
          voiceover:
            'And here’s autumn feeding, with a target of twelve kilos of sugar.',
        },
      ],
    ]);
    await g.point(
      seasons.stripKey,
      'The colours tell you what each part of the year is for',
      {
        voiceover:
          'The colours tell you what each part of the year is for: inspections, feeding, or no inspections at all.',
      },
    );

    // -- Configure: the year-round interval ----------------------------------
    await g.point(
      seasons.yearRoundInterval,
      'Days no season covers use the year-round interval',
      {
        voiceover:
          'Days that no season covers fall back to the year-round interval. Let’s set it to seven days.',
      },
    );
    await g.do(
      'Seven days for the rest of the year',
      () => seasons.setYearRoundInterval(7),
      {
        target: seasons.yearRoundInterval,
        voiceover: 'Seven days, a sensible rhythm for the quieter weeks.',
      },
    );
    await expect(seasons.yearRoundInterval).toHaveValue('7');
    await g.point(
      seasons.stripYearRound,
      'Those weeks now show an inspection every seven days',
      {
        voiceover:
          'And now those empty weeks show an inspection tick every seven days.',
      },
    );

    // -- Show: what a season sets --------------------------------------------
    await g.do(
      'Tap a season to open it',
      () => seasons.openSeason('Autumn feeding'),
      {
        target: seasons.stripSeason('Autumn feeding'),
        voiceover: 'Tap a season to open it. Let’s look at autumn feeding.',
      },
    );
    await g.tour([
      [
        seasons.editorNameInput,
        'Every season has a name you choose',
        {
          voiceover: 'Every season has a name you choose, like autumn feeding.',
        },
      ],
      [
        seasons.editorStartButton,
        'Start and end repeat every year, even across New Year',
        {
          voiceover:
            'The start and end are month and day, because seasons repeat every year. They can even run across the new year.',
        },
      ],
      [
        seasons.editorInspectionInterval,
        'An interval here overrides the year-round one',
        {
          voiceover:
            'An interval here overrides the year-round one, for a season that needs more or fewer visits. Leave it empty to keep the year-round rhythm.',
        },
      ],
      [
        seasons.editorFeedingTarget,
        'Feeding tracks a sugar target in this window',
        {
          voiceover:
            'Tick feeding to track how much sugar you give in this window, and set the target. Here it is twelve kilos.',
        },
      ],
    ]);
    await g.do(
      'Done folds it back into the list',
      () => seasons.doneEditing(),
      {
        target: seasons.editorDoneButton,
        voiceover: 'Done folds it back into the list.',
      },
    );

    // -- Do: add the missing season ------------------------------------------
    await g.chapter(
      'Shape the year',
      'Add winter, and stop inspections for it',
      {
        voiceover:
          'Now let’s add the one season the year is still missing: winter.',
      },
    );
    await g.do(
      'Click the empty days to fill them',
      () => seasons.addSeasonFromStrip(),
      {
        target: seasons.stripYearRound,
        voiceover:
          'Click the empty days on the strip and Hive Pal fills the whole gap with one season. This gap runs from November to February, so it becomes one season across the new year.',
      },
    );
    await g.point(
      seasons.editorStartButton,
      'One season, from November to February',
      {
        voiceover:
          'It starts in November and ends at the end of February, wrapping around the year.',
      },
    );
    await g.do(
      'Call it “Winter rest”',
      () => seasons.nameSeason('Winter rest'),
      {
        target: seasons.editorNameInput,
        voiceover: 'Call it winter rest.',
      },
    );
    await g.do(
      'Winter? Turn inspections off',
      () => seasons.setInspections(false),
      {
        target: seasons.editorInspectionsSwitch,
        voiceover:
          'In winter there is nothing to inspect, so turn inspections off. Nothing is scheduled, and nothing turns overdue, until the season ends.',
      },
    );
    await expect(seasons.editorInspectionInterval).toHaveCount(0);
    await g.do('Done', () => seasons.doneEditing(), {
      target: seasons.editorDoneButton,
      voiceover: 'Done.',
    });
    await expect(seasons.seasonRow('Winter rest')).toContainText(
      'No inspections',
    );
    await g.point(
      seasons.seasonRow('Winter rest'),
      'A quiet season in the list',
      {
        voiceover:
          'Winter now sits in the list as a quiet season, with no inspections due.',
      },
    );
    await g.point(
      seasons.stripKey,
      'The key shows winter’s colour: no inspections',
      {
        voiceover:
          'The whole year is covered now, and the key shows winter’s colour: no inspections.',
      },
    );
    await g.do('Save the schedule', () => seasons.save(), {
      target: seasons.saveButton,
      voiceover: 'Save it, and every hive that follows the apiary picks it up.',
    });
    await expect(page.getByText('Apiary seasons saved')).toBeVisible();

    // -- Do: roll it out to every hive ---------------------------------------
    await g.point(seasons.applyButton, 'Give every hive its own copy', {
      voiceover:
        'Hives that inherit follow changes automatically. When you want every hive to own the schedule, apply it to all of them.',
    });
    await g.do('Apply to all hives', () => seasons.openApplyDialog(), {
      target: seasons.applyButton,
      voiceover: 'Apply to all hives.',
    });
    await g.point(
      seasons.applyDialogDescription,
      'This replaces each hive’s own schedule',
      {
        voiceover:
          'This replaces each hive’s own seasons and year-round interval, so it asks first.',
      },
    );
    await g.do('Confirm', () => seasons.confirmApply(), {
      target: seasons.applyConfirmButton,
      voiceover: 'Confirm, and every hive gets it.',
    });
    await expect(page.getByText('Seasons applied to 3 hives')).toBeVisible();

    // -- Do: inherit, or customise a single hive -----------------------------
    await g.chapter(
      'Hives follow the apiary',
      'A copy per hive, or one shared schedule',
      { voiceover: 'Let’s see what that means on a hive.' },
    );
    await g.do('Back to the dashboard', () => dashboard.openFromSidebar(), {
      target: dashboard.homeLink,
      voiceover: 'Back to the dashboard.',
    });
    await expect(dashboard.hive('Hive 1')).toBeVisible();
    await g.do('Open a hive', () => dashboard.openHive('Hive 1'), {
      target: dashboard.hive('Hive 1'),
      voiceover: 'Open one of the hives.',
    });
    await page.waitForURL(`**/hives/${demo.hives['Hive 1'].id}`);
    await g.do('Its Settings tab', () => hive.tab('Settings').click(), {
      target: hive.tab('Settings'),
      reveal: true,
      voiceover: 'Its settings hold the seasons it follows.',
    });
    await expect(hive.seasonsSettings).toBeVisible();

    await expect(hive.seasonsSourceBadge).toHaveText('This hive');
    await g.point(
      hive.seasonsSourceBadge,
      'This hive owns a copy, because we applied it',
      {
        voiceover:
          'Because we applied the schedule, this hive has its own copy, and the badge says so.',
      },
    );
    await g.tour([
      [
        seasons.seasonRow('Winter rest'),
        'Winter rest came along, with no inspections',
        {
          voiceover:
            'Winter rest came along with the rest, still with no inspections.',
        },
      ],
      [
        seasons.yearStrip,
        'The same year strip, now editable for this hive',
        {
          voiceover:
            'And the same year strip, now editable for this hive alone.',
        },
      ],
    ]);
    await g.do(
      'Rather follow the apiary? One click',
      () => hive.useApiarySeasons(),
      {
        target: hive.useApiarySeasonsButton,
        voiceover:
          'If you would rather this hive follow the apiary, choose use apiary seasons.',
      },
    );
    await expect(hive.seasonsSourceBadge).toHaveText('The apiary');
    await expect(hive.seasonsSummary).toBeVisible();
    await g.point(hive.seasonsSummary, 'It follows the apiary again', {
      voiceover: 'It follows the apiary again, with the same seasons.',
    });
    await g.point(
      hive.inheritedYearRound,
      'Including the year-round interval',
      {
        voiceover:
          'The apiary’s year-round interval comes along too, so the hive follows the whole schedule.',
      },
    );
    await g.do('Save the settings', () => hive.saveSettings(), {
      target: hive.saveSettingsButton,
      voiceover: 'Save, and the switch is kept.',
    });
    await expect(
      page.getByText('Hive settings updated successfully'),
    ).toBeVisible();
    await g.point(
      hive.seasonsSourceBadge,
      'The apiary leads, and hive copies are yours to change',
      {
        voiceover:
          'One schedule for the apiary, and a copy only where you need it. That is seasons in Hive Pal.',
      },
    );
  });
});
