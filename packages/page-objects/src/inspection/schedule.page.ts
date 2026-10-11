import { Locator, Page } from '@playwright/test';

/** `/inspections/schedule` */
export class ScheduleInspectionPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly todayCard: Locator;
  readonly batchToggle: Locator;
  readonly batchNameInput: Locator;
  /** "Schedule N Inspection(s)" or "Create Batch Inspection". */
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Schedule Inspection' });
    this.todayCard = page.getByText('Today', { exact: true }).first();
    this.batchToggle = page.getByRole('checkbox', {
      name: 'Create as Batch Inspection',
    });
    this.batchNameInput = page.getByLabel('Batch Name');
    this.submitButton = page.getByRole('button', {
      name: /^(Schedule \d+ Inspections?|Create Batch Inspection)$/,
    });
  }

  async goto() {
    await this.page.goto('/inspections/schedule');
  }

  /** Tick a hive in the "Select Hives" card by its name. */
  async selectHive(name: string) {
    await this.page.locator('label', { hasText: name }).first().click();
  }

  async pickToday() {
    await this.todayCard.click();
  }
}
