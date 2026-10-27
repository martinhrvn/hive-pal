import { Locator, Page } from '@playwright/test';
import { BoxEditorPage } from './box-editor.page';

/** `/hives/create` and `/hives/:id/edit` */
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
  /** "Feature Photo (optional)": the picker block, its hidden file input and preview. */
  readonly featurePhoto: Locator;
  readonly featurePhotoInput: Locator;
  readonly featurePhotoPreview: Locator;
  /** Collapsible "Advanced Settings": base inspection frequency. */
  readonly advancedSettingsToggle: Locator;
  readonly inspectionFrequencyInput: Locator;
  /** Collapsible "Box Configuration" with the "Configure initial box setup" checkbox. */
  readonly boxConfigToggle: Locator;
  readonly configureBoxesCheckbox: Locator;
  /** The simplified box builder shown once boxes are configured. */
  readonly boxes: BoxEditorPage;

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
    this.featurePhoto = page
      .getByText('Feature Photo', { exact: false })
      .first()
      .locator('..');
    this.featurePhotoInput = page.locator('form input[type="file"]');
    this.featurePhotoPreview = this.featurePhoto.getByRole('img');
    this.advancedSettingsToggle = page.getByRole('button', {
      name: 'Advanced Settings',
    });
    this.inspectionFrequencyInput = page.getByLabel(
      'Year-round inspection interval (days)',
    );
    this.boxConfigToggle = page.getByRole('button', {
      name: 'Box Configuration',
    });
    this.configureBoxesCheckbox = page.getByLabel(
      'Configure initial box setup',
    );
    this.boxes = new BoxEditorPage(page, page.locator('form'));
  }

  /** Upload a feature photo; it is stored right away, before the form is saved. */
  async uploadFeaturePhoto(file: string) {
    const uploaded = this.page.waitForResponse(
      res =>
        res.url().includes('/api/photos') && res.request().method() === 'POST',
    );
    await this.featurePhotoInput.setInputFiles(file);
    await uploaded;
  }

  async openAdvancedSettings() {
    if (
      (await this.advancedSettingsToggle.getAttribute('aria-expanded')) !==
      'true'
    )
      await this.advancedSettingsToggle.click();
  }

  async openBoxConfiguration() {
    if ((await this.boxConfigToggle.getAttribute('aria-expanded')) !== 'true')
      await this.boxConfigToggle.click();
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

  /**
   * Select a day of the currently shown month in the date picker
   * (react-day-picker v10: each day cell carries `data-day="yyyy-MM-dd"`).
   */
  async selectDate(date: Date) {
    await this.openCalendar();
    const iso = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
    await this.page
      .locator(`[role="gridcell"][data-day="${iso}"]`)
      .getByRole('button')
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
