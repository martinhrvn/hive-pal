import { Locator, Page } from '@playwright/test';

/** `/hives/:id` */
export class HiveDetailPage {
  readonly page: Page;
  readonly addInspectionButton: Locator;
  readonly scheduleInspectionButton: Locator;
  readonly addQueenButton: Locator;
  readonly editHiveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addInspectionButton = page
      .getByRole('button', { name: 'Add Inspection' })
      .first();
    this.scheduleInspectionButton = page
      .getByRole('button', { name: 'Schedule Inspection' })
      .first();
    this.addQueenButton = page
      .getByRole('button', { name: 'Add Queen' })
      .first();
    this.editHiveButton = page
      .getByRole('button', { name: 'Edit Hive' })
      .first();
  }

  heading(name: string): Locator {
    return this.page.getByRole('heading', { level: 1, name });
  }

  /** Tab labels are hard-coded English: Overview, Analytics, Boxes, Settings, Queen History. */
  tab(name: string): Locator {
    return this.page.getByRole('tab', { name });
  }

  async goto(hiveId: string) {
    await this.page.goto(`/hives/${hiveId}`);
  }
}
