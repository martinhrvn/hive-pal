import { Locator, Page } from '@playwright/test';
import { TEST_SELECTORS } from '../utils';

export class HiveFormPage {
  private readonly page: Page;
  readonly nameInput: Locator;
  readonly apiarySelect: Locator;
  readonly notesTextarea: Locator;
  readonly installationDateButton: Locator;
  readonly calendar: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByLabel('Label');
    this.apiarySelect = page.getByRole('combobox', { name: 'Apiary' });
    this.notesTextarea = page.getByLabel('notes');
    this.installationDateButton = page.getByRole('button',  { name: 'Installation date' });
    this.calendar = page.locator('.rdp-month');
    this.submitButton = page.getByRole('button', { name: 'Submit' });
  }

  /**
   * Open the apiary dropdown
   */
  async openApiaryDropdown() {
    await this.apiarySelect.click();
  }

  /**
   * Select an apiary by name
   */
  async selectApiary(apiaryName: string) {
    await this.openApiaryDropdown();
    await this.page.getByRole('option', { name: new RegExp(apiaryName) }).click();
  }

  /**
   * Open the calendar picker
   */
  async openCalendar() {
    await this.installationDateButton.click();
  }

  /**
   * Select a date from the calendar
   */
  async selectDate(date: Date) {
    await this.openCalendar();
    // Format date to match the expected format in the calendar
    const day = date.getDate();
    await this.page.getByRole('gridcell', { name: day.toString() }).click();
  }

  /**
   * Fill the hive form with the provided data
   */
  async fillHiveForm({
    name,
    apiaryName,
    notes,
    installationDate,
  }: {
    name: string;
    apiaryName?: string;
    notes?: string;
    installationDate?: Date;
  }) {
    await this.nameInput.fill(name);

    if (apiaryName) {
      await this.selectApiary(apiaryName);
    }

    if (notes) {
      await this.notesTextarea.fill(notes);
    }

    if (installationDate) {
      await this.selectDate(installationDate);
    } else {
      // Use today's date as default if not provided
      await this.selectDate(new Date());
    }
  }

  /**
   * Submit the hive form
   */
  async submitForm() {
    await this.submitButton.click();
  }

  /**
   * Fill and submit the hive form
   */
  async createHive({
    name,
    apiaryName,
    notes,
    installationDate,
  }: {
    name: string;
    apiaryName?: string;
    notes?: string;
    installationDate?: Date;
  }) {
    await this.fillHiveForm({ name, apiaryName, notes, installationDate });
    await this.submitForm();
  }
}