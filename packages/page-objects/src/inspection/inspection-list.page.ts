import { Locator, Page } from '@playwright/test';

/** `/inspections` and `/inspections/list/:view` (All / Recent / Upcoming). */
export class InspectionListPage {
  readonly page: Page;
  readonly hiveColumnHeader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.hiveColumnHeader = page.getByRole('columnheader', { name: 'Hive' });
  }

  async goto(view: 'all' | 'recent' | 'upcoming' = 'all') {
    await this.page.goto(
      view === 'all' ? '/inspections' : `/inspections/list/${view}`,
    );
  }

  /** Table row containing the given text (usually the hive name). */
  row(text: string): Locator {
    return this.page.getByRole('row').filter({ hasText: text });
  }

  async view(text: string) {
    await this.row(text).first().getByRole('button', { name: 'View' }).click();
  }

  async edit(text: string) {
    await this.row(text).first().getByRole('button', { name: 'Edit' }).click();
  }
}
