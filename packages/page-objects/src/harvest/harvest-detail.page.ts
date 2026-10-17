import { expect, Locator, Page } from '@playwright/test';

export type HarvestStatusLabel = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';

/** `/harvests/:id`: weight, hive distribution and the finalize/reopen flow. */
export class HarvestDetailPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly statusBadge: Locator;
  readonly backButton: Locator;
  readonly deleteButton: Locator;
  readonly finalizeButton: Locator;
  readonly reopenButton: Locator;
  readonly infoCard: Locator;
  readonly setWeightButton: Locator;
  readonly weightInput: Locator;
  readonly saveWeightButton: Locator;
  readonly notesSection: Locator;
  readonly distributionCard: Locator;
  readonly editHivesButton: Locator;
  readonly draftAlert: Locator;
  readonly readyToFinalizeAlert: Locator;
  /** Cloud-only "Harvest finalized!" share prompt. */
  readonly sharePrompt: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Harvest Details' });
    this.statusBadge = page.locator('h1 + [data-slot="badge"]');
    this.backButton = page
      .getByRole('button')
      .filter({ has: page.locator('svg.lucide-arrow-left') });
    this.deleteButton = page
      .getByRole('button')
      .filter({ has: page.locator('svg.lucide-trash-2') });
    this.finalizeButton = page.getByRole('button', { name: 'Finalize' });
    this.reopenButton = page.getByRole('button', { name: 'Reopen' });
    this.infoCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Harvest Information' });
    this.setWeightButton = this.infoCard.getByRole('button', {
      name: 'Set Weight',
    });
    this.weightInput = this.infoCard.getByPlaceholder('0.0');
    this.saveWeightButton = this.infoCard.getByRole('button', { name: 'Save' });
    this.notesSection = this.infoCard
      .locator('div')
      .filter({ has: page.getByText('Notes', { exact: true }) })
      .last();
    this.distributionCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Hive Distribution' });
    this.editHivesButton = this.distributionCard.getByRole('button', {
      name: 'Edit',
    });
    this.draftAlert = page
      .locator('[data-slot="alert"]')
      .filter({ hasText: 'Draft Harvest' });
    this.readyToFinalizeAlert = page
      .locator('[data-slot="alert"]')
      .filter({ hasText: 'Ready to Finalize' });
    this.sharePrompt = page.getByRole('dialog', { name: 'Harvest finalized!' });
  }

  /** A hive's row in the distribution card (frames, honey amount and share). */
  distributionRow(hiveName: string): Locator {
    return this.distributionCard
      .locator('div.border')
      .filter({ hasText: hiveName });
  }

  async goto(harvestId: string) {
    await this.page.goto(`/harvests/${harvestId}`);
    await expect(this.heading).toBeVisible();
  }

  async expectStatus(status: HarvestStatusLabel) {
    await expect(this.statusBadge).toHaveText(status);
  }

  /** Type a total weight (in the user's unit) and save it. */
  async enterWeight(weight: number | string) {
    await this.setWeightButton.click();
    await this.weightInput.fill(String(weight));
    await this.saveWeightButton.click();
  }

  /** Set the total weight and wait for the distribution to be calculated. */
  async setWeight(weight: number) {
    await this.enterWeight(weight);
    await expect(this.weightInput).toBeHidden();
    await this.expectStatus('IN_PROGRESS');
    await expect(this.readyToFinalizeAlert).toBeVisible();
  }

  /** Finalize, dismissing the cloud share prompt if it appears. */
  async finalize() {
    await this.finalizeButton.click();
    await this.expectStatus('COMPLETED');
    // The modal prompt hides the rest of the page from the accessibility tree.
    await expect(this.reopenButton.or(this.sharePrompt)).toBeVisible();
    if (await this.sharePrompt.isVisible()) {
      await this.sharePrompt.getByRole('button', { name: 'Skip' }).click();
      await expect(this.sharePrompt).toBeHidden();
    }
    await expect(this.reopenButton).toBeVisible();
  }

  async reopen() {
    await this.reopenButton.click();
    await this.expectStatus('IN_PROGRESS');
  }

  async backToList() {
    await this.backButton.click();
    await expect(this.page).toHaveURL(/\/harvests$/);
  }
}
