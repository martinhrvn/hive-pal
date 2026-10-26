import { Locator, Page, expect } from '@playwright/test';

/** `/tools/brood-timeline`: the free brood development timeline. */
export class BroodTimelinePage {
  readonly page: Page;
  readonly heading: Locator;
  /** The "Development Timeline" card: the coloured bar and the stage rows. */
  readonly timeline: Locator;
  readonly dateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', {
      level: 1,
      name: 'Brood Development Timeline',
    });
    this.timeline = page.locator('[data-slot="card"]').filter({
      has: page.locator('[data-slot="card-title"]', {
        hasText: /^Development Timeline$/,
      }),
    });
    this.dateButton = page.getByRole('button', { name: 'Pick a date' });
  }

  async goto() {
    await this.page.goto('/tools/brood-timeline');
    await expect(this.heading).toBeVisible();
  }

  /** "Queen", "Worker", "Drone" or "Compare All". */
  caste(name: string): Locator {
    return this.page.getByRole('checkbox', { name, exact: true });
  }

  async pickCaste(name: string) {
    await this.caste(name).click();
    await expect(this.caste(name)).toBeChecked();
  }

  /** A stage row of the timeline ("Egg", "Larva", "Pupa", "Adult"). */
  stage(name: string): Locator {
    return this.timeline.getByText(name, { exact: true }).locator('../../..');
  }

  /** Set the day the egg was laid, going back a month if needed. */
  async pickLaidDate(date: Date) {
    await this.dateButton.click();
    const iso = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
    const day = this.page.locator(`[role="gridcell"][data-day="${iso}"]`);
    if (!(await day.isVisible()))
      await this.page.getByRole('button', { name: /previous month/i }).click();
    await day.getByRole('button').click();
    await this.page.keyboard.press('Escape');
  }
}
