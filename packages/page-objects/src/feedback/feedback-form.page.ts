import { Locator, Page } from '@playwright/test';

/** The `/feedback` form and its "Thank You!" confirmation state. */
export class FeedbackFormPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly typeSelect: Locator;
  readonly subjectInput: Locator;
  readonly messageInput: Locator;
  readonly submitButton: Locator;
  readonly thankYouHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    // The card title "Send Feedback" is a plain div that shares its text with
    // the sidebar entry, so the form is identified by its first field label.
    this.heading = page.getByText('Feedback Type', { exact: true });
    this.typeSelect = page.getByRole('combobox', { name: 'Feedback Type' });
    this.subjectInput = page.getByLabel('Subject');
    this.messageInput = page.getByLabel('Message');
    this.submitButton = page.getByRole('button', { name: 'Submit Feedback' });
    this.thankYouHeading = page.getByRole('heading', { name: 'Thank You!' });
  }

  async goto() {
    await this.page.goto('/feedback');
  }

  async selectType(label: 'Bug Report' | 'Feature Suggestion' | 'Other') {
    await this.typeSelect.click();
    await this.page.getByRole('option', { name: label }).click();
  }

  async fill(data: {
    type: 'Bug Report' | 'Feature Suggestion' | 'Other';
    subject: string;
    message: string;
  }) {
    await this.selectType(data.type);
    await this.subjectInput.fill(data.subject);
    await this.messageInput.fill(data.message);
  }

  async submit() {
    await this.submitButton.click();
  }
}
