import { Locator, Page } from '@playwright/test';

export class HiveFormPage {
  private readonly page: Page;
  readonly nameInput: Locator;
  readonly apiarySelect: Locator;
  readonly notesTextarea: Locator;
  /** Date popover trigger, labelled by the "Installation Date" form label. */
  readonly installationDateButton: Locator;
  readonly calendar: Locator;
  /** "Submit" on create, "Save" on edit. */
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByLabel('Label');
    this.apiarySelect = page.getByRole('combobox', { name: 'Apiary' });
    this.notesTextarea = page.getByLabel('notes');
    this.installationDateButton = page.getByRole('button', {
      name: 'Installation Date',
    });
    this.calendar = page.locator('.rdp-month');
    this.submitButton = page.getByRole('button', { name: /^(Submit|Save)$/ });
  }

  async openApiaryDropdown() {
    await this.apiarySelect.click();
  }

  async selectApiary(apiaryName: string) {
    await this.openApiaryDropdown();
    await this.page
      .getByRole('option', { name: new RegExp(apiaryName) })
      .click();
  }

  async openCalendar() {
    await this.installationDateButton.click();
  }

  /** Select a day of the currently shown month in the date picker (react-day-picker v8). */
  async selectDate(date: Date) {
    await this.openCalendar();
    const day = String(date.getDate());
    await this.page
      .locator('button[name="day"]:not(.day-outside)', {
        hasText: new RegExp('^' + day + '$'),
      })
      .first()
      .click();
  }

  /** Pick today unless the form already has a date. */
  async ensureInstallationDate() {
    const label = (await this.installationDateButton.textContent()) ?? '';
    if (/Pick a date/i.test(label)) {
      await this.selectDate(new Date());
    }
  }

  /** Fill the form. Picks today as installation date unless one is given or already set. */
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
      await this.ensureInstallationDate();
    }
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async createHive(data: {
    name: string;
    apiaryName?: string;
    notes?: string;
    installationDate?: Date;
  }) {
    await this.fillHiveForm(data);
    await this.submitForm();
  }
}
