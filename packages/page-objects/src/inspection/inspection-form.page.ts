import { Locator, Page } from '@playwright/test';

/** Create/edit inspection form (`/inspections/create`, `/hives/:id/inspections/create`, `/inspections/:id/edit`). */
export class InspectionFormPage {
  readonly page: Page;
  readonly hiveSelect: Locator;
  readonly notesTextarea: Locator;
  /** Primary submit; label varies (Save / Save and next / Complete Inspection). */
  readonly saveButton: Locator;
  /** "Save and complete" when editing a non-completed inspection. */
  readonly saveAndCompleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // The hive select trigger has no accessible name; match it by its placeholder/value text.
    this.hiveSelect = page
      .getByRole('combobox')
      .filter({ hasText: /Select a hive/ })
      .first();
    this.notesTextarea = page.getByLabel('Notes').first();
    this.saveButton = page.getByTestId('inspection-save');
    this.saveAndCompleteButton = page.getByTestId('inspection-save-complete');
  }

  async selectHive(name: string) {
    await this.hiveSelect.click();
    await this.page.getByRole('option', { name: new RegExp(name) }).click();
  }

  async fillNotes(text: string) {
    await this.notesTextarea.fill(text);
  }

  async save() {
    await this.saveButton.click();
  }
}
