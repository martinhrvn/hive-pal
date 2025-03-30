import { Locator, Page, expect } from '@playwright/test';
import { TEST_SELECTORS } from '../utils';

export class FeedingsSectionPageObject {
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