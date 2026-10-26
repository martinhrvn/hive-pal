import { AddActionDialog, HiveDetailPage } from 'page-objects';
import { expect, GUIDE_MODE, test } from './guide.fixture';

const PRODUCT = 'Oxalic Acid';

// A short: one task, portrait, about a minute. CI runs it as a plain test on
// desktop; it is only recorded in the mobile pass.
test.describe('Guides', { tag: ['@guide'] }, () => {
  test('Varroa treatment', async ({ page, g, demo }, testInfo) => {
    test.skip(
      GUIDE_MODE && testInfo.project.name !== 'guides-mobile',
      'short: recorded in the mobile pass only',
    );
    const hiveId = demo.hives['Hive 1'].id;
    const hive = new HiveDetailPage(page);
    const dialog = new AddActionDialog(page);

    await page.goto(`/hives/${hiveId}`);
    await expect(hive.heading('Hive 1')).toBeVisible();

    // A Short opens on the app, not a title card: the hook is spoken over it.
    await g.say('Just treated for varroa?', {
      voiceover:
        'Just treated for varroa? Log it right away, so you always know what each hive got, and when.',
    });
    await g.do('Add Entry → Action', () => dialog.open(), {
      target: dialog.addEntryButton,
      voiceover: 'On the hive page, tap Add Entry, then Action,',
    });
    await g.do('Treatment', () => dialog.actionType('Treatment').click(), {
      target: dialog.actionType('Treatment'),
      voiceover: 'and choose Treatment.',
    });
    await g.do('Pick the product', () => dialog.pickProduct(PRODUCT), {
      target: dialog.productSelect,
      voiceover:
        'Pick the product. Hive Pal knows the common ones, and sets the right unit for you.',
    });
    await g.do('How much you used', () => dialog.fillAmount(2), {
      target: dialog.amountInput,
      voiceover: 'Enter how much you used,',
    });
    await g.do(
      'Save',
      async () => {
        await dialog.treatmentSaveButton.click();
        await dialog.save();
      },
      { target: dialog.treatmentSaveButton, voiceover: 'and save.' },
    );

    await expect(dialog.timelineTreatment(PRODUCT)).toBeVisible();
    await g.point(dialog.timelineTreatment(PRODUCT), 'On the timeline', {
      voiceover: 'It’s on the hive’s timeline,',
    });
    // Needs the catalog product on the action: the card adds up its
    // ingredients and works out the withdrawal period from it.
    await expect(dialog.treatmentSummary).toContainText(
      'Withdrawal passed — safe to harvest',
    );
    await g.point(dialog.treatmentSummary, 'Active ingredients', {
      voiceover:
        'and Hive Pal adds up the active ingredients each hive received, and tells you when it’s safe to harvest.',
    });
    await g.say('Treat, log, done.');
    await g.outro({ short: true });
  });
});
