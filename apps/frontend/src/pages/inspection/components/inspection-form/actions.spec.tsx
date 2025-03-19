import { expect, test } from '@playwright/experimental-ct-react';
import { ActionsSection } from '@/pages/inspection/components/inspection-form/actions.tsx';
import { Page } from '@playwright/test';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';

class FeedingsSectionObject {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  selectFeeding() {
    return this.page.getByText('Feeding').click();
  }

  getFeedType(feedType: string) {
    return this.page.getByRole('checkbox', { name: feedType });
  }

  async selectFeedType(feedType: string) {
    const checkbox = this.page.getByRole('checkbox', { name: feedType });
    if (await checkbox.isChecked()) return;
    return this.page.getByRole('checkbox', { name: feedType }).click();
  }

  getQuentityField() {
    return this.page.getByRole('spinbutton', { name: 'Quantity ' });
  }

  selectConcentration(concentration: string) {
    return this.page.getByRole('option', { name: concentration }).click();
  }

  getConcentrationField() {
    return this.page.getByRole('combobox');
  }

  getSaveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }

  assertInViewMode(text: string) {
    return this.page.getByTestId(TEST_SELECTORS.FEEDING_VIEW).getByText(text);
  }

  getEditButton() {
    return this.page
      .getByTestId(TEST_SELECTORS.FEEDING_VIEW)
      .getByRole('button', { name: 'Edit' });
  }

  getRemoveButton() {
    return this.page
      .getByTestId(TEST_SELECTORS.FEEDING_VIEW)
      .getByRole('button', { name: 'Delete' });
  }

  async fillFeedingForm(
    feedType: string,
    quantity: string,
    concentration?: string,
  ) {
    if (feedType !== 'Syrup') {
      await this.getFeedType(feedType).click();
      await expect(
        this.page
          .getByTestId(TEST_SELECTORS.FEEDING_FORM)
          .getByText('g', { exact: true }),
      ).toBeVisible();
      await expect(this.getConcentrationField()).not.toBeVisible();
    }
    await this.getQuentityField().fill(quantity);

    if (concentration && feedType === 'Syrup') {
      await this.getConcentrationField().click();
      await this.selectConcentration(concentration);
      await expect(
        this.page
          .getByTestId(TEST_SELECTORS.FEEDING_FORM)
          .getByText('ml', { exact: true }),
      ).toBeVisible();
    }

    await this.getSaveButton().click();
  }

  async verifyFeedingView(
    quantity: string,
    feedType: string,
    unit: string,
    concentration?: string,
  ) {
    await expect(
      this.page.getByTestId(TEST_SELECTORS.FEEDING_FORM),
    ).not.toBeVisible();
    await expect(
      this.page.getByTestId(TEST_SELECTORS.FEEDING_VIEW),
    ).toBeVisible();
    await expect(this.assertInViewMode(`${quantity}${unit}`)).toBeVisible();
    await expect(this.assertInViewMode(feedType)).toBeVisible();

    if (concentration) {
      await expect(this.assertInViewMode(concentration)).toBeVisible();
    }
  }
}

class TreatmentSectionObject {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  getAmountField() {
    return this.page.getByRole('spinbutton', { name: 'Amount ' });
  }

  getTreatmentTypeField() {
    return this.page.getByRole('combobox');
  }

  selectTreatmentType(treatmentType: string) {
    return this.page.getByRole('option', { name: treatmentType }).click();
  }

  getSaveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }

  assertInViewMode(text: string) {
    return this.page.getByTestId(TEST_SELECTORS.TREATMENT_VIEW).getByText(text);
  }

  getEditButton() {
    return this.page
      .getByTestId(TEST_SELECTORS.TREATMENT_VIEW)
      .getByRole('button', { name: 'Edit' });
  }

  getRemoveButton() {
    return this.page
      .getByTestId(TEST_SELECTORS.TREATMENT_VIEW)
      .getByRole('button', { name: 'Delete' });
  }

  async fillTreatmentForm(treatmentType: string, amount: string) {
    if (treatmentType !== 'Oxalic Acid') {
      await this.getTreatmentTypeField().click();
      await this.selectTreatmentType(treatmentType);
    }
    await this.getAmountField().fill(amount);
    await this.getSaveButton().click();
  }

  async verifyTreatmentView(amount: string, treatmentType: string, unit: string) {
    await expect(this.page.getByTestId(TEST_SELECTORS.TREATMENT_FORM)).not.toBeVisible();
    await expect(this.page.getByTestId(TEST_SELECTORS.TREATMENT_VIEW)).toBeVisible();
    await expect(this.assertInViewMode(`${amount}${unit}`)).toBeVisible();
    await expect(this.assertInViewMode(treatmentType)).toBeVisible();
  }
}

class ActionsSectionObject {
  readonly page: Page;
  readonly feedingSection: FeedingsSectionObject;
  readonly treatmentSection: TreatmentSectionObject;
  
  constructor(page: Page) {
    this.page = page;
    this.feedingSection = new FeedingsSectionObject(page);
    this.treatmentSection = new TreatmentSectionObject(page);
  }

  selectAction(action: string) {
    return this.getAction(action).click();
  }

  getAction(action: string) {
    return this.page
      .getByTestId(TEST_SELECTORS.ACTION_BUTTONS)
      .getByText(action);
  }

  async setupComponent() {
    return new ActionsSectionObject(this.page);
  }
}

test.describe('Action chips', () => {
  [
    'Feeding',
    'Treatment',
    'Boxes',
    'Frames',
    'Harvest',
    'Requeening',
    'Split',
  ].forEach(label => {
    test(`renders ${label} chip`, async ({ page, mount }) => {
      await mount(<ActionsSection />);
      await expect(page.getByText(label)).toBeVisible();
    });
  });
});

test.describe('Feeding', () => {
  test('When selecting Feeding form should be added to the inspection', async ({
    page,
    mount,
  }) => {
    await mount(<ActionsSection />);
    const actionsSection = new ActionsSectionObject(page);
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
    await mount(<ActionsSection />);
    const actionsSection = new ActionsSectionObject(page);
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
    await mount(<ActionsSection />);
    const actionsSection = new ActionsSectionObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    await feedingSection.fillFeedingForm('Honey', '500');

    await feedingSection.verifyFeedingView('500', 'Honey', 'g');

    await expect(actionsSection.getAction('Feeding')).not.toBeVisible();
  });

  test('When selecting Candy we should have quantity in g and no concentration select', async ({
    page,
    mount,
  }) => {
    await mount(<ActionsSection />);
    const actionsSection = new ActionsSectionObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    await feedingSection.fillFeedingForm('Candy', '450');
    await feedingSection.verifyFeedingView('450', 'Candy', 'g');

    await expect(actionsSection.getAction('Feeding')).not.toBeVisible();
  });

  test('Edit should work', async ({ page, mount }) => {
    await mount(<ActionsSection />);
    const actionsSection = new ActionsSectionObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    await feedingSection.fillFeedingForm('Honey', '500');
    await feedingSection.verifyFeedingView('500', 'Honey', 'g');

    await feedingSection.getEditButton().click();
    await expect(page.getByTestId(TEST_SELECTORS.FEEDING_FORM)).toBeVisible();
    await feedingSection.getQuentityField().fill('600');
    await feedingSection.getSaveButton().click();

    await feedingSection.verifyFeedingView('600', 'Honey', 'g');
  });

  test('Remove should work', async ({ page, mount }) => {
    await mount(<ActionsSection />);
    const actionsSection = new ActionsSectionObject(page);
    const feedingSection = actionsSection.feedingSection;
    await actionsSection.selectAction('Feeding');

    await feedingSection.fillFeedingForm('Honey', '500');
    await feedingSection.verifyFeedingView('500', 'Honey', 'g');

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
    await mount(<ActionsSection />);
    const actionsSection = new ActionsSectionObject(page);
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
    await mount(<ActionsSection />);
    const actionsSection = new ActionsSectionObject(page);
    const treatmentSection = actionsSection.treatmentSection;
    await actionsSection.selectAction('Treatment');
    
    await treatmentSection.fillTreatmentForm('Formic Acid', '25');
    await treatmentSection.verifyTreatmentView('25', 'Formic Acid', 'ml');

    await expect(actionsSection.getAction('Treatment')).not.toBeVisible();
  });

  test('Edit should work', async ({ page, mount }) => {
    await mount(<ActionsSection />);
    const actionsSection = new ActionsSectionObject(page);
    const treatmentSection = actionsSection.treatmentSection;
    await actionsSection.selectAction('Treatment');
    
    await treatmentSection.fillTreatmentForm('Thymol', '15');
    await treatmentSection.verifyTreatmentView('15', 'Thymol', 'ml');
    
    await treatmentSection.getEditButton().click();
    await expect(page.getByTestId(TEST_SELECTORS.TREATMENT_FORM)).toBeVisible();
    await treatmentSection.getAmountField().fill('20');
    await treatmentSection.getSaveButton().click();
    
    await treatmentSection.verifyTreatmentView('20', 'Thymol', 'ml');
  });

  test('Remove should work', async ({ page, mount }) => {
    await mount(<ActionsSection />);
    const actionsSection = new ActionsSectionObject(page);
    const treatmentSection = actionsSection.treatmentSection;
    await actionsSection.selectAction('Treatment');
    
    await treatmentSection.fillTreatmentForm('Other', '30');
    await treatmentSection.verifyTreatmentView('30', 'Other', 'ml');
    
    await treatmentSection.getRemoveButton().click();
    await expect(page.getByTestId(TEST_SELECTORS.TREATMENT_VIEW)).not.toBeVisible();
    await expect(actionsSection.getAction('Treatment')).toBeVisible();
  });
});
