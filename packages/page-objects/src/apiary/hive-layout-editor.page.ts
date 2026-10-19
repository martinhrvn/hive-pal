import { Locator, Page } from '@playwright/test';

/**
 * The hive layout grid on the apiary page's "Hives" tab. Hives are arranged
 * by dragging them (native HTML5 drag and drop, desktop only) from the
 * "Unpositioned Hives" card onto a grid cell.
 */
export class HiveLayoutEditor {
  readonly page: Page;
  readonly heading: Locator;
  /** The card listing hives that are not on the grid yet. */
  readonly unpositionedCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Hive Layout' });
    this.unpositionedCard = page.getByTestId('unpositioned-hives');
  }

  unpositionedHive(name: string): Locator {
    return this.unpositionedCard.getByRole('heading', { name, exact: true });
  }

  /** A grid cell, empty or holding a hive (0-based row and column). */
  cell(row: number, col: number): Locator {
    return this.page.locator(
      `[data-testid="layout-cell"][data-row="${row}"][data-col="${col}"]`,
    );
  }

  /** The grid cell holding the named hive. */
  placedHive(name: string): Locator {
    return this.page.getByTestId('layout-cell').filter({
      has: this.page.getByRole('heading', { name, exact: true }),
    });
  }

  /** Drag an unpositioned hive onto a grid cell and wait until it lands. */
  async placeHive(name: string, row: number, col: number) {
    // Scrolling mid-drag drops nothing: start with the target row at the top,
    // so it and the unpositioned card below the grid are both on screen.
    await this.cell(row, col).evaluate(el =>
      el.scrollIntoView({ block: 'start' }),
    );
    await this.unpositionedHive(name).dragTo(this.cell(row, col));
    await this.cell(row, col)
      .getByRole('heading', { name, exact: true })
      .waitFor();
  }
}
