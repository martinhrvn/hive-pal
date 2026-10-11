import { Locator, Page } from '@playwright/test';

/** `/hives` — table of hives in the active apiary; each row navigates to the detail page. */
export class HiveListPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/hives');
  }

  row(name: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(escapeRegExp(name)) });
  }

  async openDetails(name: string) {
    await this.row(name).click();
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
