import { Locator, Page } from '@playwright/test';

export class SignupPage {
  readonly page: Page;
  readonly emailField: Locator;
  readonly passwordField: Locator;
  readonly confirmPasswordField: Locator;
  readonly displayNameField: Locator;
  readonly privacyCheckbox: Locator;
  readonly signUpButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailField = page.getByLabel('email');
    this.passwordField = page.getByRole('textbox', {
      name: 'Password',
      exact: true,
    });
    this.confirmPasswordField = page.getByRole('textbox', {
      name: 'Confirm Password',
    });
    this.displayNameField = page.getByRole('textbox', { name: 'Display Name' });
    this.privacyCheckbox = page.getByRole('checkbox', {
      name: 'I agree to the Privacy Policy',
    });
    this.signUpButton = page.getByRole('button', { name: /register/i });
  }

  async goToSignUpPage() {
    await this.page.goto('/register');
  }

  /** Fill in the account details (both password fields get `password`). */
  async fillDetails(email: string, password: string, displayName: string) {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
    await this.confirmPasswordField.fill(password);
    await this.displayNameField.fill(displayName);
  }

  /** Tick the privacy consent and submit the form. */
  async acceptAndSubmit() {
    await this.privacyCheckbox.check();
    await this.signUpButton.click();
  }

  /** Fill every required field (including the privacy consent) and submit. */
  async signUp(email: string, password: string, displayName: string) {
    await this.fillDetails(email, password, displayName);
    await this.acceptAndSubmit();
  }
}
