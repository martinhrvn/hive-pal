import { Locator, Page, expect } from '@playwright/test';
import { TEST_SELECTORS } from '../utils/test-selectors';

export class TreatmentSectionPageObject {
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

  async verifyTreatmentView(
    amount: string,
    treatmentType: string,
    unit: string,
  ) {
    await expect(
      this.page.getByTestId(TEST_SELECTORS.TREATMENT_FORM),
    ).not.toBeVisible();
    await expect(
      this.page.getByTestId(TEST_SELECTORS.TREATMENT_VIEW),
    ).toBeVisible();
    await expect(this.assertInViewMode(`${amount} ${unit}`)).toBeVisible();
    await expect(this.assertInViewMode(treatmentType)).toBeVisible();
  }
}
