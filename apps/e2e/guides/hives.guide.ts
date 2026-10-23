import path from 'node:path';
import {
  AppSidebar,
  BoxEditorPage,
  HiveActionSidebar,
  HiveDetailPage,
  HiveFormPage,
  HiveListPage,
} from 'page-objects';
import { expect, test } from './guide.fixture';
import { seedHiveHistory } from './hive-history';
import { allowStoredWeather, mockWeather } from './weather-mock';

const NEW_HIVE = 'Meadow';
/** A frame full of bees, from the landing page. */
const PHOTO = path.join(__dirname, '../../frontend/public/hero3.jpg');

test.describe('Guides', { tag: ['@guide'] }, () => {
  test('Managing your hives', async ({ page, context, g, demo }) => {
    // Long: a recording with voice runs well over ten minutes.
    test.setTimeout(30 * 60_000);
    await seedHiveHistory(demo.user.api, demo.hives['Hive 1'].id);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await allowStoredWeather(page);
    await mockWeather(page, demo.user.apiaryId);

    const sidebar = new AppSidebar(page);
    const list = new HiveListPage(page);
    const form = new HiveFormPage(page);
    const hive = new HiveDetailPage(page);
    const actions = new HiveActionSidebar(page);
    const boxes = new BoxEditorPage(page);

    await page.goto('/');
    await expect(sidebar.nav('Hives')).toBeVisible();

    await g.intro('Your hives', 'Create, configure and get to know them', {
      voiceover:
        'Welcome to Hive Pal. Each hive is where everything comes together: its boxes, its inspections, its feedings and its history. In this guide, we’ll create a hive, look around its page, and go through the box editor in detail.',
    });

    // -- Create a hive --------------------------------------------------------
    await g.chapter('Create a hive', 'Every option on the form', {
      voiceover: 'Let’s start by creating a new hive.',
    });
    await g.do('Open All Hives in the sidebar', () => list.openFromSidebar(), {
      target: list.allHivesLink,
      voiceover:
        'Your hives are in the sidebar. All Hives opens the full list.',
    });
    await g.do('Click “Create New Hive”', () => list.createButton.click(), {
      target: list.createButton,
      voiceover: 'From here, click Create New Hive.',
    });
    await g.do('Give it a name', () => form.nameInput.fill(NEW_HIVE), {
      target: form.nameInput,
      voiceover:
        'Give the hive a name, the one you use at the apiary, so you’ll recognise it straight away. We’ll call this one Meadow.',
    });
    await g.point(form.apiarySelect, 'It goes into your current apiary', {
      voiceover:
        'It goes into the apiary you’re working in. If you keep bees in more than one place, you can pick another one here.',
    });
    await g.do(
      'Notes are for anything worth remembering',
      () => form.notesTextarea.fill('Swarm caught in May. Gentle bees.'),
      {
        target: form.notesTextarea,
        voiceover:
          'Notes are for anything worth remembering about this colony, like where it came from, or how it behaves.',
      },
    );
    await g.do('Add a feature photo', () => form.uploadFeaturePhoto(PHOTO), {
      target: form.featurePhoto,
      voiceover:
        'You can add a feature photo too. It shows at the top of the hive’s page, so every hive is easy to tell apart.',
    });
    await expect(form.featurePhotoPreview).toBeVisible();
    const installed = new Date();
    installed.setDate(1);
    await g.do(
      'Set when the colony was installed',
      () => form.selectDate(installed),
      {
        target: form.installationDateButton,
        voiceover:
          'Then set the date the colony moved in. Hive Pal uses it to show how long the hive has been going.',
      },
    );

    await g.do(
      'Advanced Settings: feeding and inspections',
      () => form.openAdvancedSettings(),
      {
        target: form.advancedSettingsToggle,
        voiceover:
          'Under Advanced Settings, you can tune two things for this hive.',
      },
    );
    await g.point(form.autumnStartSelect, 'Your autumn feeding window', {
      voiceover:
        'First, your autumn feeding window: the months when you feed the bees up for winter. By default, that’s August to October.',
    });
    await g.do(
      'And how much you aim to feed, in sugar',
      () => form.autumnTargetInput.fill('15'),
      {
        target: form.autumnTargetInput,
        voiceover:
          'Next to it is how much you aim to feed, in kilos of sugar. This colony is a big one, so let’s make it fifteen. Hive Pal will track your feedings against this target.',
      },
    );
    await g.point(
      form.inspectionFrequencyInput,
      'How often you want to inspect this hive',
      {
        voiceover:
          'Second, how often you want to inspect this hive, in days. Hive Pal reminds you when a visit is overdue, so set what suits your season.',
      },
    );

    await g.do(
      'Box Configuration: set up the boxes',
      async () => {
        await form.openBoxConfiguration();
        await form.configureBoxesCheckbox.check();
      },
      {
        target: form.boxConfigToggle,
        voiceover:
          'Under Box Configuration, you can set up the boxes the hive starts with.',
      },
    );
    await expect(form.boxes.box(1)).toBeVisible();
    await g.do(
      'Add a honey super on top',
      () => form.boxes.addBoxButton.click(),
      {
        target: form.boxes.addBoxButton,
        voiceover:
          'It starts with one brood box. Let’s add a honey super on top.',
      },
    );
    await expect(form.boxes.box(2)).toContainText('Honey');
    await g.do(
      'Click a box to change its details',
      () => form.boxes.selectBox(2),
      {
        target: form.boxes.box(2),
        voiceover:
          'Click any box to change its details. We’ll go through every one of these options later in this guide, so for now, let’s keep going.',
      },
    );
    await g.do('Submit', () => form.submitForm(), {
      target: form.submitButton,
      voiceover: 'Submit, and the hive is ready.',
    });
    await page.waitForURL(url => !url.pathname.includes('/create'));

    // -- Your hive at a glance -----------------------------------------------
    await g.chapter(
      'Your hive at a glance',
      'The header and the daily alerts',
      {
        voiceover: 'Now let’s open our new hive and take a look.',
      },
    );
    await g.do(
      'It’s already in the sidebar',
      () => sidebar.hive(NEW_HIVE).click(),
      {
        target: sidebar.hive(NEW_HIVE),
        voiceover:
          'It’s already listed in the sidebar, with your other hives. Let’s open it.',
      },
    );
    await expect(hive.heading(NEW_HIVE)).toBeVisible();
    await g.point(hive.header, 'Your photo, name and notes at the top', {
      voiceover:
        'At the top is the photo we added, with the hive’s name and notes, and when it was established.',
    });
    await g.point(
      hive.statusButton,
      'Its status: active, sold, dead, archived',
      {
        voiceover:
          'This button shows the hive’s status. If a colony dies, or you sell it, change the status here, with the date it happened.',
      },
    );

    await expect(actions.alert(/no recorded inspections/)).toBeVisible();
    await g.point(actions.alerts, 'Alerts flag what needs your attention', {
      voiceover:
        'On the right, there’s already an alert: this hive has no inspections yet.',
    });
    await g.point(
      actions.alert(/no recorded inspections/),
      'Hive Pal checks every hive daily, and after every change',
      {
        voiceover:
          'Every night, Hive Pal checks all your hives, and it checks a hive again whenever you change something. It flags inspections that are overdue, based on the frequency we just set, and young queens that should be laying by now.',
      },
    );
    await g.point(
      actions.alert(/no recorded inspections/).getByRole('button', {
        name: 'Resolve',
      }),
      'Mark it resolved, or dismiss it',
      {
        voiceover:
          'When you’ve dealt with an alert, mark it resolved with the tick, or dismiss it with the cross. An inspection clears this one by itself.',
      },
    );

    // -- Overview -------------------------------------------------------------
    await g.chapter('Overview', 'Tasks and the activity timeline', {
      voiceover:
        'Below the header, the Overview tab gathers what’s going on with the hive.',
    });
    await g.point(hive.todosCard, 'Tasks for this hive', {
      voiceover:
        'The Todos card holds tasks for this hive only, so they’re right there when you open it.',
    });
    await g.do(
      'Add one in a line',
      () => hive.addTodo('Add a second super next week'),
      {
        target: hive.todoInput,
        voiceover:
          'Type a task and add it. Tasks can do a lot more, with due dates and reminders, and they have their own guide.',
      },
    );
    await expect(hive.todosCard).toContainText('Add a second super next week');
    await g.point(hive.timeline, 'Everything that happens shows up here', {
      voiceover:
        'Further down, the activity timeline lists everything that happens to the hive: inspections, feedings, treatments, quick notes, and box changes.',
    });

    // -- A hive with a history -----------------------------------------------
    await g.chapter(
      'A hive with a history',
      'What a season of inspections tells you',
      {
        voiceover:
          'A new hive is a bit empty, so let’s look at one with a season behind it.',
      },
    );
    await g.do('Open Hive 1', () => sidebar.hive('Hive 1').click(), {
      target: sidebar.hive('Hive 1'),
      voiceover: 'Hive 1 has been inspected all summer. Let’s open it.',
    });
    await expect(hive.heading('Hive 1')).toBeVisible();
    await expect(
      actions.alert(/overdue for inspection \(10 days since/),
    ).toBeVisible();
    await g.point(
      actions.alert(/overdue for inspection/),
      'Ten days since the last visit: overdue',
      {
        voiceover:
          'Its last inspection was ten days ago, and the hive is set to every seven days, so Hive Pal flags it as overdue.',
      },
    );
    await g.point(hive.stats, 'The brood nest from the last inspection', {
      voiceover:
        'The header now shows the brood nest from the last inspection, frame by frame.',
    });
    await g.point(hive.feedingSummary, 'Autumn feeding, against your target', {
      voiceover:
        'And here’s the autumn feeding: how much you’ve fed this year, and how far along you are towards this autumn’s target.',
    });

    await g.do('Open Analytics', () => hive.tab('Analytics').click(), {
      target: hive.tab('Analytics'),
      voiceover:
        'The Analytics tab turns your inspections into charts, so you can see the whole season at once.',
    });
    await g.point(hive.periodSelect, 'Pick the period to show', {
      voiceover:
        'Pick the period you want to see. By default, it’s the last six months.',
    });
    await g.tour([
      [
        hive.chart('Frame Composition'),
        'What every frame held, visit by visit',
        {
          voiceover:
            'Frame Composition shows what all your frames held at each visit: eggs, brood, pollen, nectar, honey and empty comb.',
        },
      ],
      [
        hive.chart('Brood Nest Trend'),
        'How the brood nest grew and shrank',
        {
          voiceover:
            'The brood nest trend shows the colony building up in spring, and winding down towards autumn.',
        },
      ],
      [
        hive.chart('Store Trend'),
        'Pollen, nectar and honey over the season',
        {
          voiceover:
            'Store trend follows pollen, nectar and honey. You can see the summer flow filling the supers.',
        },
      ],
      [
        hive.chart('Colony Strength'),
        'Colony strength at each visit',
        {
          voiceover:
            'Colony strength shows how strong the bees were at each visit,',
        },
      ],
      [
        hive.chart('Queen Cells'),
        'Queen cells: that spike in June was swarm season',
        {
          voiceover:
            'and the queen cells chart makes swarm season easy to spot. That spike in June was a colony getting ready to swarm.',
        },
      ],
      [
        hive.chart('Feeding History'),
        'And every feeding, week by week',
        {
          voiceover:
            'At the bottom, the feeding history shows every feeding, week by week.',
        },
      ],
    ]);
    await g.do(
      'Settings: change these any time',
      () => hive.tab('Settings').click(),
      {
        target: hive.tab('Settings'),
        voiceover:
          'The feeding window, the target and the inspection frequency we set on the form can be changed any time, on the Settings tab.',
      },
    );
    await expect(hive.autumnFeedingSettings).toBeVisible();

    // -- The box editor -------------------------------------------------------
    await g.chapter('The box editor', 'Boxes, frames, sizes and maintenance', {
      voiceover:
        'Now for the box editor, where you keep the hive in the app looking like the hive in your apiary.',
    });
    await g.do('Open Boxes', () => hive.tab('Boxes').click(), {
      target: hive.tab('Boxes'),
      voiceover: 'Open the Boxes tab.',
    });
    await expect(boxes.boxes).toHaveCount(3);
    await g.point(boxes.box(1), 'The stack reads from the bottom up', {
      voiceover:
        'The stack reads from the bottom up, just like the real hive: a brood box at the bottom,',
    });
    await g.point(boxes.excluderBar, 'A queen excluder', {
      voiceover:
        'a queen excluder above it, to keep the queen down in the brood box,',
    });
    await g.point(boxes.box(3), 'And two honey supers', {
      voiceover:
        'and two honey supers on top. Each box shows its type, how many frames it holds, and its frame size.',
    });
    await g.tour([
      [
        boxes.cover,
        'The cover on top',
        { voiceover: 'The cover sits on top,' },
      ],
      [
        boxes.bottomBoard,
        'And the bottom board underneath',
        { voiceover: 'and the bottom board underneath.' },
      ],
    ]);
    await g.do('Click “Edit Configuration”', () => boxes.edit(), {
      target: boxes.editButton,
      voiceover: 'To change anything, click Edit Configuration.',
    });
    await g.do('Click a box to select it', () => boxes.selectBox(3), {
      target: boxes.box(3),
      voiceover: 'Click a box to select it. Let’s take the top super.',
    });
    await expect(boxes.propertiesPanel).toBeVisible();
    await g.point(boxes.propertiesPanel, 'Its properties open on the right', {
      voiceover: 'Its properties open on the right.',
    });

    await g.do(
      'Purpose: brood box, honey super or feeder',
      async () => {
        await boxes.purposeSelect.click();
        await page.waitForTimeout(1500);
        await boxes.option('Honey Super').click();
      },
      {
        target: boxes.purposeSelect,
        voiceover:
          'Purpose says what the box is for: a brood box, a honey super, or a feeder box. This one stays a honey super.',
      },
    );
    await g.do('Frame size: pick from the list', () => boxes.openFrameSizes(), {
      target: boxes.frameSizeSelect,
      voiceover:
        'Frame size is next. The list has the common built-in sizes, like Langstroth, Dadant, National and Warré,',
    });
    await g.point(
      boxes.frameSizeList,
      'Built-in, community, and your own sizes',
      {
        voiceover:
          'followed by sizes other beekeepers have shared, and the ones you’ve added yourself.',
      },
    );
    await g.do(
      'Not there? Add a custom size',
      () => boxes.pickFrameSize('Custom...'),
      {
        voiceover: 'If your frames aren’t on the list, pick Custom.',
      },
    );
    await g.do(
      'Name it and enter its measurements',
      () =>
        boxes.fillCustomSize({
          name: 'Slovak Standard',
          width: 390,
          height: 240,
          depth: 25,
        }),
      {
        target: boxes.customSizeName,
        voiceover:
          'Give it a name, and enter the width, height and depth in millimetres.',
      },
    );
    await g.point(
      boxes.customSizeName,
      'Saved to your sizes, and shared once approved',
      {
        voiceover:
          'When you submit it, it’s saved to your own sizes straight away. Once it’s approved, other beekeepers can use it too. We’ll cancel this one.',
      },
    );
    await g.do('Cancel', () => boxes.customSizeCancel.click(), {
      target: boxes.customSizeCancel,
      voiceover: 'Cancel,',
    });
    await g.say('Upper boxes only offer sizes that fit the box below', {
      voiceover:
        'and one thing to know: boxes above the bottom one only offer frame sizes that fit it, so the stack always makes sense.',
    });

    await g.do(
      'Maximum frames: how many fit in the box',
      () => boxes.setMaxFrames(9),
      {
        target: boxes.maxFramesInput,
        voiceover:
          'Maximum frames is how many frames fit in the box. Some beekeepers run nine in a ten-frame super, so let’s set nine.',
      },
    );
    await g.do('Then how many are in it right now', () => boxes.setFrames(8), {
      target: boxes.framesSlider,
      voiceover:
        'The slider sets how many frames are in it right now. We put two more in, so that’s eight.',
    });
    await expect(boxes.framesLabel).toHaveText('Frames: 8 / 9');
    await g.do(
      'Pick a colour to match your paint',
      () => boxes.colorPreset('#84cc16').click(),
      {
        target: boxes.colorPresets,
        voiceover:
          'Pick a colour to match the paint on your boxes. It makes the stack easy to read at a glance.',
      },
    );
    await g.point(boxes.excluderCheckbox, 'Queen excluder above this box', {
      voiceover:
        'Tick queen excluder to put an excluder above a box, like the one under these supers.',
    });
    await g.point(
      boxes.winterizedCheckbox,
      'Winterized: wrapped up for winter',
      {
        voiceover:
          'Winterized marks a box that’s insulated or wrapped up for winter.',
      },
    );
    await g.do(
      'Or winterize the whole hive at once',
      () => boxes.winterizeAllButton.click(),
      {
        target: boxes.winterizeAllButton,
        voiceover: 'Or, when the time comes, winterize the whole hive at once.',
      },
    );
    await expect(boxes.winterizeAllButton).toHaveText(/Unwinterize/);
    await g.do(
      'It’s not winter yet, so undo it',
      () => boxes.winterizeAllButton.click(),
      {
        target: boxes.winterizeAllButton,
        voiceover: 'It’s not quite winter yet, so let’s undo that.',
      },
    );

    await g.do('Add a box', () => boxes.addBoxButton.click(), {
      target: boxes.addBoxButton,
      voiceover: 'Add Box puts a new box on top of the stack.',
    });
    await expect(boxes.boxes).toHaveCount(4);
    await g.do('Make it a feeder', () => boxes.setPurpose('Feeder Box'), {
      target: boxes.purposeSelect,
      voiceover: 'Let’s make this one a feeder.',
    });
    await g.do('Move boxes up and down', () => boxes.moveDown(4), {
      target: boxes.box(4).getByRole('button', { name: 'Move box down' }),
      voiceover: 'The arrows next to a box move it up or down the stack.',
    });
    await expect(boxes.box(3)).toContainText('Feeder');
    await g.do('Or take it off', () => boxes.removeBox(3), {
      target: boxes.box(3).getByRole('button', { name: 'Remove box' }),
      voiceover: 'And the cross takes a box off the hive again.',
    });
    await expect(boxes.boxes).toHaveCount(3);

    await g.do(
      'Cleaned the bottom board? Log it',
      () => boxes.logMaintenance(boxes.bottomBoard, 'Cleaned'),
      {
        target: boxes.maintenanceButton(boxes.bottomBoard),
        voiceover:
          'The wrench logs maintenance. Cleaned the bottom board? Pick the date, and click Cleaned, or Replaced.',
      },
    );
    await expect(boxes.bottomBoard).toContainText('Cleaned');
    await g.point(
      boxes.bottomBoard,
      'Saved right away, on the cover and every box too',
      {
        voiceover:
          'That’s saved straight away, as a maintenance entry on the timeline. The cover and every box have the same option.',
      },
    );
    await g.do('Save the boxes', () => boxes.save(), {
      target: boxes.saveButton,
      voiceover: 'When the stack looks right, save it.',
    });
    await expect(
      page.getByText('Box configuration saved successfully'),
    ).toBeVisible();

    // -- More from the sidebar ------------------------------------------------
    await g.chapter(
      'More from the sidebar',
      'Inspections, queens, QR codes and AI',
      {
        voiceover:
          'Finally, let’s go back to our new hive and look at the sidebar.',
      },
    );
    await g.do('Back to Meadow', () => sidebar.hive(NEW_HIVE).click(), {
      target: sidebar.hive(NEW_HIVE),
      voiceover: 'Back to Meadow.',
    });
    await expect(hive.heading(NEW_HIVE)).toBeVisible();
    await g.tour([
      [
        actions.action('Add Inspection'),
        'Record an inspection',
        { voiceover: 'Add Inspection opens the full inspection form,' },
      ],
      [
        actions.action('Mobile Inspection'),
        'Or step by step, at the hive',
        {
          voiceover:
            'and Mobile Inspection walks you through it step by step, with big buttons that work with gloves on, right at the hive.',
        },
      ],
      [
        actions.action('Schedule Inspection'),
        'Plan your next visit',
        { voiceover: 'Schedule Inspection plans your next visit.' },
      ],
      [
        actions.action('Add Queen'),
        'Record the queen',
        { voiceover: 'Add Queen records the queen heading this colony,' },
      ],
      [
        actions.action('Split colony'),
        'Split the colony',
        {
          voiceover:
            'and Split colony walks you through making a split. Both have their own guides.',
        },
      ],
    ]);
    await g.do('QR Code: a label for the hive', () => actions.openQrCode(), {
      target: actions.action('QR Code'),
      voiceover:
        'QR Code makes a label for the hive. Print it and stick it on the box.',
    });
    await g.point(actions.qrDialog, 'Scan it to jump straight to the hive', {
      voiceover:
        'Scan it with your phone, and you’re straight on this hive, or in a new inspection. There’s a separate guide on QR codes.',
    });
    await actions.closeDialog();
    await g.do(
      'LLM Prompt: the hive’s story, for AI',
      () => actions.openLlmPrompt(),
      {
        target: actions.action('LLM Prompt'),
        voiceover:
          'LLM Prompt puts the hive’s whole story into one piece of text: its boxes, queen, settings and recent inspections.',
      },
    );
    await g.point(actions.llmPromptText, 'Edit it if you like', {
      voiceover: 'You can read it, and edit it if you like.',
    });
    await g.do(
      'Copy it, and paste it into any AI chat',
      async () => {
        await actions.copyLlmPrompt();
        // "Copied" only shows for a moment, so check it right away.
        await expect(actions.llmCopyButton).toHaveText('Copied');
      },
      {
        target: actions.llmCopyButton,
        voiceover:
          'Then copy it, and paste it into the AI chat of your choice, for a second opinion on how your hive is doing.',
      },
    );
    await actions.closeDialog();

    // -- Archive or delete ----------------------------------------------------
    await g.point(
      actions.action('Archive Hive'),
      'When a hive is gone: archive it, or delete it',
      {
        voiceover:
          'And when a hive is gone, you have two options at the bottom.',
      },
    );
    await g.do(
      'Delete Permanently removes everything',
      () => actions.openDeletePermanently(),
      {
        target: actions.action('Delete Permanently'),
        voiceover:
          'Delete Permanently removes the hive and all of its data, for good.',
      },
    );
    await g.point(
      actions.deleteNameInput,
      'You type the hive’s name to confirm',
      {
        voiceover:
          'So you can’t do it by accident, you have to type the hive’s name first. Usually you don’t want this, so let’s cancel.',
      },
    );
    await actions.closeDialog();
    await g.do('Archive keeps the history', () => actions.openArchive(), {
      target: actions.action('Archive Hive'),
      voiceover:
        'Archive Hive is usually the better choice. The hive leaves your active list, but its whole history is kept.',
    });
    await g.do('Archive', () => actions.archiveConfirmButton.click(), {
      target: actions.archiveConfirmButton,
      voiceover: 'Confirm, and the hive is archived.',
    });
    await page.waitForURL(/\/apiaries\//);
    await g.say('That’s it. Happy beekeeping!', {
      voiceover: 'That’s it. Happy beekeeping!',
    });
    await g.outro();
  });
});
