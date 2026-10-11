import { Locator, Page } from '@playwright/test';

/** `/forgot-password` */
export class ForgotPasswordPage {
  readonly page: Page;
  readonly emailField: Locator;
  readonly sendResetLinkButton: Locator;
  /** Heading shown after the request succeeded. */
  readonly sentHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailField = page.getByLabel('Email address');
    this.sendResetLinkButton = page.getByRole('button', {
      name: 'Send Reset Link',
    });
    this.sentHeading = page.getByRole('heading', { name: 'Reset Link Sent' });
  }

  async goto() {
    await this.page.goto('/forgot-password');
  }

  async requestReset(email: string) {
    await this.emailField.fill(email);
    await this.sendResetLinkButton.click();
  }
}
