import { Locator, Page } from '@playwright/test';

/**
 * Main navigation in the sidebar. Top-level entries render as buttons or
 * links depending on whether they have sub-items, so both roles are matched.
 */
export class AppSidebar {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  nav(label: string): Locator {
    return this.page
      .getByRole('navigation')
      .getByRole('link', { name: label, exact: true })
      .or(
        this.page
          .getByRole('navigation')
          .getByRole('button', { name: label, exact: true }),
      )
      .first();
  }

  async open(label: string) {
    await this.nav(label).click();
  }
}
