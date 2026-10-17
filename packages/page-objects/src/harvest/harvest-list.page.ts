import { expect, Locator, Page } from '@playwright/test';
import { AppSidebar } from '../shell';
import { HarvestWizard } from './harvest-wizard.page';

export type HarvestStatCard =
  'Total Harvests' | 'Total Honey' | 'Average Yield' | 'Latest Harvest';

/** `/harvests`: statistics cards, harvest history and the "Start Harvest" wizard. */
export class HarvestListPage {
  readonly page: Page;
  readonly heading: Locator;
  /** The "Start Harvest" button in the page header. */
  readonly startHarvestButton: Locator;
  readonly statCards: Locator;
  readonly totalHarvestsCard: Locator;
  readonly totalYieldCard: Locator;
  readonly averageYieldCard: Locator;
  readonly latestHarvestCard: Locator;
  readonly historyCard: Locator;
  readonly historyTable: Locator;
  /** Data rows of the history table (header row excluded). */
  readonly historyRows: Locator;
  /** Column header that carries the user's weight unit, e.g. "Honey (kg)". */
  readonly honeyColumnHeader: Locator;
  readonly emptyState: Locator;
  readonly wizard: HarvestWizard;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Harvests', level: 1 });
    this.startHarvestButton = page
      .getByRole('button', { name: 'Start Harvest' })
      .first();
    this.statCards = this.statCard(
      /^(Total Harvests|Total Honey|Average Yield|Latest Harvest)$/,
    );
    this.totalHarvestsCard = this.statCard('Total Harvests');
    this.totalYieldCard = this.statCard('Total Honey');
    this.averageYieldCard = this.statCard('Average Yield');
    this.latestHarvestCard = this.statCard('Latest Harvest');
    this.historyCard = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText('Harvest History', { exact: true }) });
    this.historyTable = this.historyCard.getByRole('table');
    this.historyRows = this.historyTable.locator('tbody tr');
    this.honeyColumnHeader = this.historyTable.getByRole('columnheader', {
      name: /^Honey \(/,
    });
    this.emptyState = page.getByText('No harvests yet');
    this.wizard = new HarvestWizard(page);
  }

  statCard(title: HarvestStatCard | RegExp): Locator {
    return this.page.locator('[data-slot="card"]').filter({
      has: this.page.locator('[data-slot="card-title"]', {
        hasText: typeof title === 'string' ? new RegExp(`^${title}$`) : title,
      }),
    });
  }

  /** History rows containing the text, e.g. a rendered date ("June 15th, 2026"). */
  historyRow(text: string | RegExp): Locator {
    return this.historyRows.filter({ hasText: text });
  }

  async goto() {
    await this.page.goto('/harvests');
    await expect(this.heading).toBeVisible();
  }

  /** Navigate the way a user would: through the sidebar. */
  async openFromSidebar() {
    await new AppSidebar(this.page).open('Harvests');
    await expect(this.page).toHaveURL(/\/harvests$/);
    await expect(this.heading).toBeVisible();
  }

  async expectStat(card: HarvestStatCard, value: string | RegExp) {
    await expect(this.statCard(card)).toContainText(value);
  }

  /** Open a harvest from its history row. */
  async openHarvest(row: Locator) {
    await row.getByRole('button', { name: 'View' }).click();
    await expect(this.page).toHaveURL(/\/harvests\/[0-9a-f-]{36}$/);
  }
}
