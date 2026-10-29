import { expect, test } from '@playwright/test';
import { ActionsSectionPageObject } from 'page-objects';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';

test.describe('Action chips', () => {
  ['Feeding', 'Treatment', 'Frames'].forEach(label => {
    test(`renders ${label} chip`, async ({ page, mount }) => {
      await mount(
        'pages/inspection/components/inspection-form/actions/ActionsWithForm',
      );
      await expect(page.getByText(label)).toBeVisible();
    });
  });
});

test.describe('Feeding', () => {
  test('When selecting Feeding the feed-type picker with built-ins appears', async ({
    page,
    mount,
  }) => {
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
    const actionsSection = new ActionsSectionPageObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    await page
      .getByTestId(TEST_SELECTORS.FEEDING_FORM)
      .locator('#feedType')
      .click();
    await expect(page.getByRole('option', { name: 'Syrup 1:1' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Apiinvert' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Fondant' })).toBeVisible();
    await page.getByRole('option', { name: 'Syrup 1:1' }).click();
    await expect(feedingSection.getQuantityField()).toBeVisible();
  });

  test('Syrup by volume converts via density and shows the sugar readout', async ({
    page,
    mount,
  }) => {
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
    const actionsSection = new ActionsSectionPageObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    // 2 L of 1:1 syrup ≈ 2.46 kg feed at 1.23 g/ml → ≈ 1.23 kg sugar (50 %)
    await feedingSection.fillFeedingForm({
      feedType: 'Syrup 1:1',
      quantity: '2',
      unit: 'L',
    });
    await feedingSection.verifyFeedingView({
      feedType: 'Syrup 1:1',
      amountLabel: '2 L',
      sugarLabel: '≈ 1.23 kg sugar',
    });

    await expect(actionsSection.getAction('Feeding')).not.toBeVisible();
  });

  test('Accepts fractional amounts below one litre', async ({
    page,
    mount,
  }) => {
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
    const actionsSection = new ActionsSectionPageObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    await feedingSection.selectFeedType('Syrup 2:1');
    const quantity = feedingSection.getQuantityField();
    await quantity.pressSequentially('0.5');

    // The field must show what was typed and keep it, rather than rounding to 1.
    await expect(quantity).toHaveValue('0.5');
    // 0.5 L × 1.33 g/ml × 66.7 % sugar ≈ 444 g
    await expect(page.getByText('≈ 444 g of sugar')).toBeVisible();

    await feedingSection.getSaveButton().click();
    await feedingSection.verifyFeedingView({
      feedType: 'Syrup 2:1',
      amountLabel: '0.5 L',
    });
  });

  test('Commercial invert syrup can be entered by weight', async ({
    page,
    mount,
  }) => {
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
    const actionsSection = new ActionsSectionPageObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    // A 14 kg Apiinvert bucket at 72.7 % sugar → ≈ 10.18 kg sugar
    await feedingSection.fillFeedingForm({
      feedType: 'Apiinvert',
      quantity: '14',
      unit: 'kg',
    });
    await feedingSection.verifyFeedingView({
      feedType: 'Apiinvert',
      amountLabel: '14 kg',
      sugarLabel: '≈ 10.18 kg sugar',
    });
  });

  test('Solid feeds are weight-only (no volume units offered)', async ({
    page,
    mount,
  }) => {
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
    const actionsSection = new ActionsSectionPageObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    await feedingSection.selectFeedType('Fondant');
    await feedingSection.getUnitField().click();
    await expect(
      page.getByRole('option', { name: 'kg', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('option', { name: 'g', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('option', { name: 'L', exact: true }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('option', { name: 'ml', exact: true }),
    ).not.toBeVisible();
  });

  test('Water dilution is recorded in ml', async ({ page, mount }) => {
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
    const actionsSection = new ActionsSectionPageObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    await feedingSection.fillFeedingForm({
      feedType: 'Apiinvert',
      quantity: '5',
      unit: 'kg',
      waterMl: '500',
    });
    await feedingSection.verifyFeedingView({
      feedType: 'Apiinvert',
      amountLabel: '5 kg',
      waterLabel: '+ 500 ml water',
    });
  });

  test('Edit should work', async ({ page, mount }) => {
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
    const actionsSection = new ActionsSectionPageObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    await feedingSection.fillFeedingForm({
      feedType: 'Apiinvert',
      quantity: '14',
      unit: 'kg',
    });
    await feedingSection.verifyFeedingView({
      feedType: 'Apiinvert',
      amountLabel: '14 kg',
    });

    await feedingSection.getEditButton().click();
    await expect(page.getByTestId(TEST_SELECTORS.FEEDING_FORM)).toBeVisible();
    await feedingSection.getQuantityField().fill('10');
    await feedingSection.getSaveButton().click();

    await feedingSection.verifyFeedingView({
      feedType: 'Apiinvert',
      amountLabel: '10 kg',
      sugarLabel: '≈ 7.27 kg sugar',
    });
  });

  test('Remove should work', async ({ page, mount }) => {
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
    const actionsSection = new ActionsSectionPageObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    await feedingSection.fillFeedingForm({
      feedType: 'Apiinvert',
      quantity: '5',
      unit: 'kg',
    });
    await feedingSection.verifyFeedingView({
      feedType: 'Apiinvert',
      amountLabel: '5 kg',
    });

    await feedingSection.getRemoveButton().click();
    await expect(
      page.getByTestId(TEST_SELECTORS.FEEDING_VIEW),
    ).not.toBeVisible();
    await expect(actionsSection.getAction('Feeding')).toBeVisible();
  });

  test('Remembers the last-used unit per feed type', async ({
    page,
    mount,
  }) => {
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
    const actionsSection = new ActionsSectionPageObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    // Apiinvert defaults to L; save once with kg …
    await feedingSection.fillFeedingForm({
      feedType: 'Apiinvert',
      quantity: '5',
      unit: 'kg',
    });
    await feedingSection.getRemoveButton().click();

    // … and the next feeding with the same type preselects kg.
    await actionsSection.selectAction('Feeding');
    await feedingSection.selectFeedType('Apiinvert');
    await expect(feedingSection.getUnitField()).toHaveText('kg');
  });
});

// The treatment form loads its product picker from the catalog API; serve the
// built-ins the tests pick from (name + default unit are all the form reads).
const TREATMENT_PRODUCTS_FIXTURE = [
  {
    id: 'a1b2c3d4-0000-4000-8000-000000000001',
    name: 'Formic Acid',
    defaultUnit: 'ml',
  },
  {
    id: 'a1b2c3d4-0000-4000-8000-000000000002',
    name: 'Thymol',
    defaultUnit: 'g',
  },
].map(p => ({
  ...p,
  userId: null,
  physicalForm: 'LIQUID',
  applicationMethod: null,
  density: null,
  withdrawalPeriodDays: null,
  isBuiltIn: true,
  ingredients: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}));

test.describe('Treatment', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/treatment-products', route =>
      route.fulfill({ json: TREATMENT_PRODUCTS_FIXTURE }),
    );
  });

  test('When selecting Treatment form should be added to the inspection', async ({
    page,
    mount,
  }) => {
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
    const actionsSection = new ActionsSectionPageObject(page);
    const treatmentSection = actionsSection.treatmentSection;
    await actionsSection.selectAction('Treatment');

    await expect(treatmentSection.getTreatmentTypeField()).toBeVisible();
    await expect(treatmentSection.getAmountField()).toBeVisible();
    await expect(
      page.getByText('Treatment Type', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Amount')).toBeVisible();
  });

  test('Should allow selecting treatment type and setting amount', async ({
    page,
    mount,
  }) => {
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
    const actionsSection = new ActionsSectionPageObject(page);
    const treatmentSection = actionsSection.treatmentSection;
    await actionsSection.selectAction('Treatment');

    await treatmentSection.fillTreatmentForm('Formic Acid', '25');
    await treatmentSection.verifyTreatmentView('25', 'Formic Acid', 'ml');

    await expect(actionsSection.getAction('Treatment')).not.toBeVisible();
  });

  test('Edit should work', async ({ page, mount }) => {
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
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
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
    const actionsSection = new ActionsSectionPageObject(page);
    const treatmentSection = actionsSection.treatmentSection;
    await actionsSection.selectAction('Treatment');

    await treatmentSection.fillTreatmentForm('Other', '30');
    await treatmentSection.verifyTreatmentView('30', 'Custom Treatment', 'ml');

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
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
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
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
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
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
    const actionsSection = new ActionsSectionPageObject(page);
    const framesSection = actionsSection.framesSection;
    await actionsSection.selectAction('Frames');

    await framesSection.fillFramesForm('-3');
    await framesSection.verifyFramesView('-3');

    await expect(actionsSection.getAction('Frames')).not.toBeVisible();
  });

  test('Edit should work', async ({ page, mount }) => {
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
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
    await mount(
      'pages/inspection/components/inspection-form/actions/ActionsWithForm',
    );
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
