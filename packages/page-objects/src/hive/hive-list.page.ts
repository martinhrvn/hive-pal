import { Locator, Page } from '@playwright/test';

/** `/hives` — table of hives in the active apiary; the name link in each row opens the detail page. */
export class HiveListPage {
  readonly page: Page;
  /** "All Hives" under the expanded "Hives" group in the sidebar. */
  readonly allHivesLink: Locator;
  /** "Create New Hive" in the page's action sidebar. */
  readonly createButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.allHivesLink = page
      .locator('[data-sidebar="sidebar"]')
      .getByText('All Hives', { exact: true });
    this.createButton = page
      .getByRole('button', { name: 'Create New Hive', exact: true })
      .first();
  }

  async openFromSidebar() {
    await this.allHivesLink.click();
    await this.page.waitForURL(
      url => url.pathname.replace(/\/$/, '') === '/hives',
    );
  }

  async goto() {
    await this.page.goto('/hives');
  }

  row(name: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(escapeRegExp(name)) });
  }

  async openDetails(name: string) {
    await this.row(name).getByRole('link', { name, exact: true }).click();
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
