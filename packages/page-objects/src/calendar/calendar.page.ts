import { Locator, Page } from '@playwright/test';

/** `/calendar` (7-day view) */
export class CalendarPage {
  readonly page: Page;
  readonly todayButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.todayButton = page.getByRole('button', { name: 'Today', exact: true });
  }

  async goto() {
    await this.page.goto('/calendar');
  }
}
