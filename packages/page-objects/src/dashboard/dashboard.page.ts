import { Locator, Page } from '@playwright/test';

/** `/` — the home dashboard for the active apiary. */
export class DashboardPage {
  readonly page: Page;
  /** Title of the "No hives yet" empty-state card (`onboarding:empty.noHives.title`). */
  readonly noHivesTitle: Locator;
  /** "Add your first hive" link of the empty state, pointing to `/hives/create`. */
  readonly addFirstHiveLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.noHivesTitle = page.getByText('No hives yet');
    this.addFirstHiveLink = page.getByRole('link', {
      name: 'Add your first hive',
    });
  }

  async goto() {
    await this.page.goto('/');
  }

  /** A hive entry in the "Hives" section (rendered as a clickable card). */
  hive(name: string): Locator {
    return this.page.getByText(name, { exact: true }).first();
  }

  async openHive(name: string) {
    await this.hive(name).click();
  }
}
