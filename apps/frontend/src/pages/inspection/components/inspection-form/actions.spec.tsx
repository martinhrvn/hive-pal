import { expect, test } from '@playwright/experimental-ct-react';
import { ActionsSectionPageObject } from 'page-objects';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';
import { ActionsWithForm } from '@/pages/inspection/components/inspection-form/actions.story.tsx';

test.describe('Action chips', () => {
  ['Feeding', 'Treatment', 'Frames'].forEach(label => {
    test(`renders ${label} chip`, async ({ page, mount }) => {
      await mount(<ActionsWithForm />);
      await expect(page.getByText(label)).toBeVisible();
    });
  });
});

test.describe('Feeding', () => {
  test('When selecting Feeding form should be added to the inspection', async ({
    page,
    mount,
  }) => {
    await mount(<ActionsWithForm />);
    const actionsSection = new ActionsSectionPageObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');
    await expect(feedingSection.getFeedType('Syrup')).toBeVisible();
    await expect(feedingSection.getFeedType('Syrup')).toBeChecked();
    await expect(feedingSection.getFeedType('Honey')).toBeVisible();
    await expect(feedingSection.getFeedType('Candy')).toBeVisible();
    await expect(feedingSection.getQuentityField()).toBeVisible();
  });

  test('When selecting Syrup we should have quantity in ml and concentration select', async ({
    page,
    mount,
  }) => {
    await mount(<ActionsWithForm />);
    const actionsSection = new ActionsSectionPageObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    await feedingSection.fillFeedingForm('Syrup', '850', '2:1');
    await feedingSection.verifyFeedingView('850', 'Syrup', 'ml', '2:1');

    await expect(actionsSection.getAction('Feeding')).not.toBeVisible();
  });

  test('When selecting Honey we should have quantity in g and no concentration select', async ({
    page,
    mount,
  }) => {
    await mount(<ActionsWithForm />);
    const actionsSection = new ActionsSectionPageObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    await feedingSection.fillFeedingForm('Honey', '500');

    await feedingSection.verifyFeedingView('0.5', 'Honey', 'kg');

    await expect(actionsSection.getAction('Feeding')).not.toBeVisible();
  });

  test('When selecting Candy we should have quantity in g and no concentration select', async ({
    page,
    mount,
  }) => {
    await mount(<ActionsWithForm />);
    const actionsSection = new ActionsSectionPageObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    await feedingSection.fillFeedingForm('Candy', '450');
    await feedingSection.verifyFeedingView('0.45', 'Candy', 'kg');

    await expect(actionsSection.getAction('Feeding')).not.toBeVisible();
  });

  test('Edit should work', async ({ page, mount }) => {
    await mount(<ActionsWithForm />);
    const actionsSection = new ActionsSectionPageObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    await feedingSection.fillFeedingForm('Honey', '500');
    await feedingSection.verifyFeedingView('0.5', 'Honey', 'kg');

    await feedingSection.getEditButton().click();
    await expect(page.getByTestId(TEST_SELECTORS.FEEDING_FORM)).toBeVisible();
    await feedingSection.getQuentityField().fill('600');
    await feedingSection.getSaveButton().click();

    await feedingSection.verifyFeedingView('0.6', 'Honey', 'kg');
  });

  test('Remove should work', async ({ page, mount }) => {
    await mount(<ActionsWithForm />);
    const actionsSection = new ActionsSectionPageObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    await feedingSection.fillFeedingForm('Honey', '500');
    await feedingSection.verifyFeedingView('0.5', 'Honey', 'kg');

    await feedingSection.getRemoveButton().click();
    await expect(
      page.getByTestId(TEST_SELECTORS.FEEDING_VIEW),
    ).not.toBeVisible();
    await expect(actionsSection.getAction('Feeding')).toBeVisible();
  });
});

test.describe('Treatment', () => {
  test('When selecting Treatment form should be added to the inspection', async ({
    page,
    mount,
  }) => {
    await mount(<ActionsWithForm />);
    const actionsSection = new ActionsSectionPageObject(page);
    const treatmentSection = actionsSection.treatmentSection;
    await actionsSection.selectAction('Treatment');

    await expect(treatmentSection.getTreatmentTypeField()).toBeVisible();
    await expect(treatmentSection.getAmountField()).toBeVisible();
    await expect(page.getByText('Treatment Type')).toBeVisible();
    await expect(page.getByText('Amount')).toBeVisible();
  });

  test('Should allow selecting treatment type and setting amount', async ({
    page,
    mount,
  }) => {
    await mount(<ActionsWithForm />);
    const actionsSection = new ActionsSectionPageObject(page);
    const treatmentSection = actionsSection.treatmentSection;
    await actionsSection.selectAction('Treatment');

    await treatmentSection.fillTreatmentForm('Formic Acid', '25');
    await treatmentSection.verifyTreatmentView('25', 'Formic Acid', 'ml');

    await expect(actionsSection.getAction('Treatment')).not.toBeVisible();
  });

  test('Edit should work', async ({ page, mount }) => {
    await mount(<ActionsWithForm />);
    const actionsSection = new ActionsSectionPageObject(page);
    const treatmentSection = actionsSection.treatmentSection;
    await actionsSection.selectAction('Treatment');

    await treatmentSection.fillTreatmentForm('Thymol', '15');
    await treatmentSection.verifyTreatmentView('15', 'Thymol', 'g');

    await treatmentSection.getEditButton().click();
    await expect(page.getByTestId(TEST_SELECTORS.TREATMENT_FORM)).toBeVisible();
    await treatmentSection.getAmountField().fill('20');
    await treatmentSection.getSaveButton().click();

    await treatmentSection.verifyTreatmentView('20', 'Thymol', 'g');
  });

  test('Remove should work', async ({ page, mount }) => {
    await mount(<ActionsWithForm />);
    const actionsSection = new ActionsSectionPageObject(page);
    const treatmentSection = actionsSection.treatmentSection;
    await actionsSection.selectAction('Treatment');

    await treatmentSection.fillTreatmentForm('Other', '30');
    await treatmentSection.verifyTreatmentView('30', 'Custom Treatment', 'pcs');

    await treatmentSection.getRemoveButton().click();
    await expect(
      page.getByTestId(TEST_SELECTORS.TREATMENT_VIEW),
    ).not.toBeVisible();
    await expect(actionsSection.getAction('Treatment')).toBeVisible();
  });
});

test.describe('Frames', () => {
  test('When selecting Frames form should be added to the inspection', async ({
    page,
    mount,
  }) => {
    await mount(<ActionsWithForm />);
    const actionsSection = new ActionsSectionPageObject(page);
    const framesSection = actionsSection.framesSection;
    await actionsSection.selectAction('Frames');

    await expect(framesSection.getFramesField()).toBeVisible();
    await expect(
      page.getByText('Number of frames added/removed'),
    ).toBeVisible();
    await expect(
      page.getByText(
        'Use positive numbers for frames added, negative for frames removed',
      ),
    ).toBeVisible();
  });

  test('Should allow adding frames with positive numbers', async ({
    page,
    mount,
  }) => {
    await mount(<ActionsWithForm />);
    const actionsSection = new ActionsSectionPageObject(page);
    const framesSection = actionsSection.framesSection;
    await actionsSection.selectAction('Frames');

    await framesSection.fillFramesForm('5');
    await framesSection.verifyFramesView('5');

    await expect(actionsSection.getAction('Frames')).not.toBeVisible();
  });

  test('Should allow removing frames with negative numbers', async ({
    page,
    mount,
  }) => {
    await mount(<ActionsWithForm />);
    const actionsSection = new ActionsSectionPageObject(page);
    const framesSection = actionsSection.framesSection;
    await actionsSection.selectAction('Frames');

    await framesSection.fillFramesForm('-3');
    await framesSection.verifyFramesView('-3');

    await expect(actionsSection.getAction('Frames')).not.toBeVisible();
  });

  test('Edit should work', async ({ page, mount }) => {
    await mount(<ActionsWithForm />);
    const actionsSection = new ActionsSectionPageObject(page);
    const framesSection = actionsSection.framesSection;
    await actionsSection.selectAction('Frames');

    await framesSection.fillFramesForm('2');
    await framesSection.verifyFramesView('2');

    await framesSection.getEditButton().click();
    await expect(page.getByTestId(TEST_SELECTORS.FRAMES_FORM)).toBeVisible();
    await framesSection.getFramesField().fill('4');
    await framesSection.getSaveButton().click();

    await framesSection.verifyFramesView('4');
  });

  test('Remove should work', async ({ page, mount }) => {
    await mount(<ActionsWithForm />);
    const actionsSection = new ActionsSectionPageObject(page);
    const framesSection = actionsSection.framesSection;
    await actionsSection.selectAction('Frames');

    await framesSection.fillFramesForm('-2');
    await framesSection.verifyFramesView('-2');

    await framesSection.getRemoveButton().click();
    await expect(
      page.getByTestId(TEST_SELECTORS.FRAMES_VIEW),
    ).not.toBeVisible();
    await expect(actionsSection.getAction('Frames')).toBeVisible();
  });
});
