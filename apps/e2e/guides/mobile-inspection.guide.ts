import path from 'node:path';
import {
  HiveActionSidebar,
  HiveDetailPage,
  InspectionDetailPage,
  MobileWizardPage,
} from 'page-objects';
import { expect, GUIDE_MODE, test } from './guide.fixture';
import { seedHiveHistory } from './hive-history';

/** A frame full of bees, from the landing page. */
const PHOTO = path.join(__dirname, '../../frontend/public/hero3.jpg');
const NOTE = 'Swarm cells on frame 4, split next visit';

// A short: one task, portrait, about a minute. CI runs it as a plain test on
// desktop; it is only recorded in the mobile pass.
test.describe('Guides', { tag: ['@guide'] }, () => {
  test('Inspecting on your phone', async ({ page, g, demo }, testInfo) => {
    test.skip(
      GUIDE_MODE && testInfo.project.name !== 'guides-mobile',
      'short: recorded in the mobile pass only',
    );
    const hiveId = demo.hives['Hive 1'].id;
    // Boxes, so the brood counters show their "max", and a lived-in page.
    await seedHiveHistory(demo.user.api, hiveId);
    const hive = new HiveDetailPage(page);
    const actions = new HiveActionSidebar(page);
    const wizard = new MobileWizardPage(page);

    await page.goto(`/hives/${hiveId}`);
    await expect(hive.heading('Hive 1')).toBeVisible();

    // A Short opens on the app, not a title card: the hook is spoken over it.
    await g.say('A full inspection, phone in hand', {
      voiceover:
        'Doing a full inspection with your phone in one hand? Hive Pal has a step-by-step version made for the apiary.',
    });
    await g.do(
      'Tap “Mobile Inspection”',
      async () => {
        await actions.action('Mobile Inspection').click();
        await page.waitForURL(`**/hives/${hiveId}/inspect/mobile`);
      },
      {
        target: actions.action('Mobile Inspection'),
        voiceover: 'On the hive page, tap Mobile Inspection.',
      },
    );
    await g.point(wizard.progress, 'Five steps', {
      voiceover:
        'Five short steps, and the bar at the top shows where you are.',
    });

    await g.do(
      'How strong is the colony?',
      () => wizard.increase('Strength', 8),
      {
        target: wizard.counter('Strength'),
        voiceover:
          'First, how strong is the colony. Tap plus for every frame covered in bees,',
      },
    );
    await g.do(
      'Capped and open brood',
      async () => {
        await wizard.increase('Capped Brood', 4);
        await wizard.increase('Uncapped Brood', 3);
      },
      {
        target: wizard.counter('Capped Brood'),
        voiceover: 'then count the frames of capped and open brood.',
      },
    );

    await wizard.next('Stores');
    await g.do(
      'Honey and pollen',
      async () => {
        await wizard.increase('Honey Stores', 5);
        await wizard.increase('Pollen Stores', 2);
      },
      {
        target: wizard.counter('Honey Stores'),
        voiceover: 'Next, the stores: frames of honey, and of pollen.',
      },
    );

    await wizard.next('Queen');
    await g.do('Queen seen', () => wizard.choice('Seen').click(), {
      target: wizard.choice('Seen'),
      voiceover: 'Did you spot the queen? One tap.',
    });
    await expect(wizard.choice('Seen')).toHaveAttribute('aria-pressed', 'true');
    await g.do(
      'Queen cells',
      async () => {
        await wizard.increase('Queen Cells', 2);
        await wizard.choice('Swarm cells').click();
      },
      {
        target: wizard.counter('Queen Cells'),
        voiceover:
          'Found queen cells? Count them, and mark whether they’re swarm cells.',
      },
    );

    await wizard.next('Media & Notes');
    await g.do(
      'A note for later',
      async () => {
        await wizard.addPhoto(PHOTO);
        await wizard.notesInput.fill(NOTE);
      },
      {
        target: wizard.addPhotoButton,
        voiceover: 'Add a photo or a note if something’s worth remembering,',
      },
    );

    await wizard.next('Review');
    await g.point(wizard.readyToSave, 'Check, then save', {
      voiceover: 'and check the summary before you save.',
    });
    await g.do('Save inspection', () => wizard.save(), {
      target: wizard.saveButton,
      voiceover:
        'Save, and the inspection is on the hive, with everything you counted.',
    });
    await expect(
      new InspectionDetailPage(page).heading('Hive 1'),
    ).toBeVisible();
    await g.say('Big buttons, no typing, and back to the bees.');
    await g.outro({ short: true });
  });
});
