import { Locator, Page, expect } from '@playwright/test';
import { TEST_SELECTORS } from '../utils';

/**
 * Page object for the density-aware feeding form: a feed-type Select
 * (built-ins + the user's custom types), an amount field with a g/kg/ml/L
 * unit Select, an optional water-dilution field and a live sugar readout.
 */
export class FeedingsSectionPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  selectFeeding() {
    return this.page.getByText('Feeding').click();
  }

  private get form(): Locator {
    return this.page.getByTestId(TEST_SELECTORS.FEEDING_FORM);
  }

  async selectFeedType(label: string) {
    await this.form.locator('#feedType').click();
    await this.page.getByRole('option', { name: label, exact: true }).click();
  }

  getQuantityField() {
    return this.form.locator('#quantity');
  }

  /** @deprecated kept for older specs — use getQuantityField */
  getQuentityField() {
    return this.getQuantityField();
  }

  async selectUnit(unit: string) {
    await this.form.getByRole('combobox', { name: 'Unit' }).click();
    await this.page.getByRole('option', { name: unit, exact: true }).click();
  }

  getUnitField() {
    return this.form.getByRole('combobox', { name: 'Unit' });
  }

  getWaterField() {
    return this.form.locator('#waterAddedMl');
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

  async fillFeedingForm(options: {
    feedType: string;
    quantity: string;
    unit?: string;
    waterMl?: string;
  }) {
    await this.selectFeedType(options.feedType);
    await this.getQuantityField().fill(options.quantity);
    if (options.unit) {
      await this.selectUnit(options.unit);
    }
    if (options.waterMl) {
      await this.getWaterField().fill(options.waterMl);
    }
    await this.getSaveButton().click();
  }

  async verifyFeedingView(options: {
    feedType: string;
    amountLabel: string;
    sugarLabel?: string;
    waterLabel?: string;
  }) {
    await expect(
      this.page.getByTestId(TEST_SELECTORS.FEEDING_FORM),
    ).not.toBeVisible();
    await expect(
      this.page.getByTestId(TEST_SELECTORS.FEEDING_VIEW),
    ).toBeVisible();
    await expect(this.assertInViewMode(options.feedType)).toBeVisible();
    await expect(this.assertInViewMode(options.amountLabel)).toBeVisible();
    if (options.sugarLabel) {
      await expect(this.assertInViewMode(options.sugarLabel)).toBeVisible();
    }
    if (options.waterLabel) {
      await expect(this.assertInViewMode(options.waterLabel)).toBeVisible();
    }
  }
}
