import { Locator, Page, expect } from '@playwright/test';
import { TEST_SELECTORS } from '../utils';

export class FramesSectionPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  getFramesField() {
    return this.page.getByRole('spinbutton', {
      name: 'Number of frames added/removed ',
    });
  }

  getSaveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }

  assertInViewMode(text: string) {
    return this.page.getByTestId(TEST_SELECTORS.FRAMES_VIEW).getByText(text);
  }

  getEditButton() {
    return this.page
      .getByTestId(TEST_SELECTORS.FRAMES_VIEW)
      .getByRole('button', { name: 'Edit' });
  }

  getRemoveButton() {
    return this.page
      .getByTestId(TEST_SELECTORS.FRAMES_VIEW)
      .getByRole('button', { name: 'Delete' });
  }

  async fillFramesForm(frames: string) {
    await this.getFramesField().fill(frames);
    await this.getSaveButton().click();
  }

  async verifyFramesView(frames: string) {
    await expect(
      this.page.getByTestId(TEST_SELECTORS.FRAMES_FORM),
    ).not.toBeVisible();
    await expect(
      this.page.getByTestId(TEST_SELECTORS.FRAMES_VIEW),
    ).toBeVisible();

    const displayText =
      parseInt(frames) > 0 ? `+${frames} frames` : `${frames} frames`;
    await expect(this.assertInViewMode(displayText)).toBeVisible();
  }
}