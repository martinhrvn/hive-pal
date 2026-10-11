import { Locator, Page } from '@playwright/test';

/** `/inspections/:id` */
export class InspectionDetailPage {
  readonly page: Page;
  readonly editButton: Locator;
  readonly viewHiveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.editButton = page
      .getByRole('button', { name: 'Edit Inspection' })
      .first();
    this.viewHiveButton = page
      .getByRole('button', { name: 'View Hive' })
      .first();
  }

  /** The page title is the hive name. */
  heading(hiveName: string): Locator {
    return this.page.getByRole('heading', { level: 1, name: hiveName });
  }
}
