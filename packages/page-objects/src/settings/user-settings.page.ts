import { Locator, Page } from '@playwright/test';

/** The `/settings` page (general, display and notification preferences). */
export class UserSettingsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly themeSelect: Locator;
  readonly languageSelect: Locator;
  readonly dateFormatSelect: Locator;
  readonly weekStartSelect: Locator;
  readonly unitsSelect: Locator;
  readonly saveButton: Locator;
  readonly savedToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Settings', level: 1 });
    this.themeSelect = page.getByRole('combobox', { name: 'Theme' });
    this.languageSelect = page.getByRole('combobox', { name: 'Language' });
    this.dateFormatSelect = page.getByRole('combobox', { name: 'Date Format' });
    this.weekStartSelect = page.getByRole('combobox', {
      name: 'First day of week',
    });
    this.unitsSelect = page.getByRole('combobox', {
      name: 'Units of Measurement',
    });
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

  /** Open the Language list (switching applies at once; this only opens it). */
  async openLanguages() {
    await this.languageSelect.click();
  }

  /** An entry of the open Language list, by its native name ("Slovenčina"). */
  languageOption(name: string): Locator {
    return this.page.getByRole('option', { name: new RegExp(name) });
  }

  async save() {
    await this.saveButton.click();
  }
}
