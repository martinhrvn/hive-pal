import { Locator, Page } from '@playwright/test';

/** `/apiaries` — table of the user's apiaries with a "Details" button per row. */
export class ApiaryListPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/apiaries');
  }

  row(name: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(escapeRegExp(name)) });
  }

  detailsButton(name: string): Locator {
    return this.row(name).getByRole('button', { name: 'Details' });
  }

  async openDetails(name: string) {
    await this.detailsButton(name).click();
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
