import { Locator, Page } from '@playwright/test';

/** `/queens/create`, `/hives/:hiveId/queens/create` and `/queens/:id/edit` */
export class QueenFormPage {
  readonly page: Page;
  /** Numeric input labelled "Year" (defaults to the current year). */
  readonly yearField: Locator;
  readonly createButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.yearField = page.getByRole('spinbutton', { name: 'Year' });
    this.createButton = page.getByRole('button', { name: 'Create Queen' });
    this.saveButton = page.getByRole('button', { name: 'Save Changes' });
  }

  async gotoForHive(hiveId: string) {
    await this.page.goto(`/hives/${hiveId}/queens/create`);
  }

  async fillYear(year: number) {
    await this.yearField.fill(String(year));
  }

  async submitCreate() {
    await this.createButton.click();
  }
}
