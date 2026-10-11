import { Locator, Page } from '@playwright/test';

/** The user menu at the bottom of the sidebar (`data-testid="nav-user"`). */
export class NavUser {
  readonly page: Page;
  readonly trigger: Locator;
  readonly logoutItem: Locator;

  constructor(page: Page) {
    this.page = page;
    this.trigger = page.getByTestId('nav-user');
    this.logoutItem = page.getByRole('menuitem', { name: 'Log out' });
  }

  /** Log out and wait for the login page. */
  async logout() {
    await this.trigger.click();
    await this.logoutItem.click();
    await this.page.waitForURL(/\/login/);
  }
}
