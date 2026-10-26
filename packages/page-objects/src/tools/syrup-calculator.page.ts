import { Locator, Page, expect } from '@playwright/test';

/** `/tools/syrup-calculator`: the free sugar syrup calculator. */
export class SyrupCalculatorPage {
  readonly page: Page;
  readonly heading: Locator;
  /** The "Results" card: water, sugar and total weight. */
  readonly results: Locator;
  /** The "Instructions" card. */
  readonly instructions: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', {
      level: 1,
      name: 'Syrup Calculator',
    });
    this.results = this.card('Results');
    this.instructions = this.card('Instructions');
  }

  private card(title: string): Locator {
    return this.page.locator('[data-slot="card"]').filter({
      has: this.page.locator('[data-slot="card-title"]', {
        hasText: new RegExp(`^${title}$`),
      }),
    });
  }

  async goto() {
    await this.page.goto('/tools/syrup-calculator');
    await expect(this.heading).toBeVisible();
  }

  /** An option pill: a ratio ("Thick (2:1)"), a size ("10 L"), units. */
  option(name: string): Locator {
    return this.page.getByRole('checkbox', { name, exact: true });
  }

  async choose(name: string) {
    await this.option(name).click();
    await expect(this.option(name)).toBeChecked();
  }

  /** A result tile's value, e.g. result("Sugar") → "8.85 kg". */
  result(label: string): Locator {
    return this.results.getByText(label, { exact: true }).locator('..');
  }
}
