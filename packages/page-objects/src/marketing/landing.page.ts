import { Locator, Page } from '@playwright/test';

/** `/` for a logged-out visitor: the public marketing landing page. */
export class LandingPage {
  readonly page: Page;
  /** "Start free" call to action in the sticky header. */
  readonly startFreeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.startFreeButton = page
      .getByRole('banner')
      .getByRole('link', { name: 'Start free' });
  }

  async goto() {
    await this.page.goto('/');
  }

  /** Follow the header call to action to the registration page. */
  async startSignUp() {
    await this.startFreeButton.click();
  }
}
