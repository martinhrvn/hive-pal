import { Locator, Page } from '@playwright/test';

/** `/reports` */
export class ReportsPage {
  readonly page: Page;
  readonly selectApiaryHint: Locator;

  constructor(page: Page) {
    this.page = page;
    this.selectApiaryHint = page.getByText('Select an apiary to view reports');
  }

  tab(name: 'Overview' | 'Charts' | 'Trends'): Locator {
    return this.page.getByRole('tab', { name });
  }

  async goto() {
    await this.page.goto('/reports');
  }
}
