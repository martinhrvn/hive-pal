import { Locator, Page } from '@playwright/test';

/**
 * Main navigation in the sidebar (`data-sidebar="sidebar"`). Top-level entries
 * render as buttons or links depending on whether they have sub-items, so
 * both roles are matched.
 */
export class AppSidebar {
  readonly page: Page;
  readonly root: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator('[data-sidebar="sidebar"]');
  }

  nav(label: string): Locator {
    return this.root
      .getByRole('link', { name: label, exact: true })
      .or(this.root.getByRole('button', { name: label, exact: true }))
      .first();
  }

  /** A hive's link in the sidebar's "Hives" list. */
  hive(name: string): Locator {
    return this.root.getByRole('link', { name, exact: true }).first();
  }

  async open(label: string) {
    await this.nav(label).click();
  }
}
