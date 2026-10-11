import { Locator, Page } from '@playwright/test';

/** The `/settings` page (general, display and notification preferences). */
export class UserSettingsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly themeSelect: Locator;
  readonly saveButton: Locator;
  readonly savedToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Settings', level: 1 });
    this.themeSelect = page.getByRole('combobox', { name: 'Theme' });
    this.saveButton = page.getByRole('button', { name: 'Save Settings' });
    this.savedToast = page.getByText('Changes saved successfully');
  }

  async goto() {
    await this.page.goto('/settings');
  }

  /** Pick a theme ("Light", "Dark" or "System") from the Theme select. */
  async selectTheme(label: 'Light' | 'Dark' | 'System') {
    await this.themeSelect.click();
    await this.page.getByRole('option', { name: label }).click();
  }

  async save() {
    await this.saveButton.click();
  }
}
