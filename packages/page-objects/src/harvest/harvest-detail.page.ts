import { expect, Locator, Page } from '@playwright/test';
import { ShareDialog } from '../share';

export type HarvestStatusLabel = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';

/** `/harvests/:id`: weight, hive distribution and the finalize/reopen flow. */
export class HarvestDetailPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly statusBadge: Locator;
  readonly backButton: Locator;
  readonly deleteButton: Locator;
  /** Cloud-only "Share" button in the header. */
  readonly shareButton: Locator;
  readonly finalizeButton: Locator;
  readonly reopenButton: Locator;
  readonly infoCard: Locator;
  readonly setWeightButton: Locator;
  readonly weightInput: Locator;
  readonly saveWeightButton: Locator;
  /** "Total Weight" label with the weight (or the Set Weight button). */
  readonly weightField: Locator;
  /** Icon-only button next to a weight that is already set. */
  readonly editWeightButton: Locator;
  readonly notesSection: Locator;
  readonly distributionCard: Locator;
  readonly editHivesButton: Locator;
  readonly saveHivesButton: Locator;
  readonly draftAlert: Locator;
  readonly readyToFinalizeAlert: Locator;
  /** Cloud-only "Harvest finalized!" share prompt. */
  readonly sharePrompt: Locator;
  readonly sharePromptShareButton: Locator;
  readonly sharePromptSkipButton: Locator;
  readonly shareDialog: ShareDialog;

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
    this.shareButton = page.getByRole('button', { name: 'Share', exact: true });
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
    this.weightField = this.infoCard
      .locator('div')
      .filter({ has: page.getByText('Total Weight', { exact: true }) })
      .last();
    this.editWeightButton = this.weightField.getByRole('button');
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
    this.saveHivesButton = this.distributionCard.getByRole('button', {
      name: 'Save & Recalculate',
    });
    this.draftAlert = page
      .locator('[data-slot="alert"]')
      .filter({ hasText: 'Draft Harvest' });
    this.readyToFinalizeAlert = page
      .locator('[data-slot="alert"]')
      .filter({ hasText: 'Ready to Finalize' });
    this.sharePrompt = page.getByRole('dialog', { name: 'Harvest finalized!' });
    this.sharePromptShareButton = this.sharePrompt.getByRole('button', {
      name: 'Share',
    });
    this.sharePromptSkipButton = this.sharePrompt.getByRole('button', {
      name: 'Skip',
    });
    this.shareDialog = new ShareDialog(page);
  }

  /** A hive's row in the distribution card (frames, honey amount and share). */
  distributionRow(hiveName: string): Locator {
    return this.distributionCard
      .locator('div.border')
      .filter({ hasText: hiveName });
  }

  /** Frame count input of a hive while the distribution is being edited. */
  hiveFramesInput(hiveName: string): Locator {
    return this.distributionCard
      .locator('div.border')
      .filter({
        has: this.page.getByRole('checkbox', { name: hiveName, exact: true }),
      })
      .getByRole('spinbutton');
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

  /** Change a weight that is already set and wait for it to be saved. */
  async editWeight(weight: number) {
    await this.editWeightButton.click();
    await this.weightInput.fill(String(weight));
    await this.saveWeightButton.click();
    await expect(this.weightInput).toBeHidden();
    await expect(this.weightField).toContainText(
      new RegExp(`Weight${weight} (kg|lbs?)$`),
    );
  }

  /** Change one hive's frame count in the distribution and save. */
  async editHiveFrames(hiveName: string, frames: number) {
    await this.editHivesButton.click();
    await this.hiveFramesInput(hiveName).fill(String(frames));
    await expect(this.hiveFramesInput(hiveName)).toHaveValue(String(frames));
    await this.saveHivesButton.click();
    await expect(this.saveHivesButton).toBeHidden();
    await expect(this.distributionRow(hiveName)).toContainText(
      `${frames} frames`,
    );
  }

  /** Finalize, dismissing the cloud share prompt if it appears. */
  async finalize() {
    if (await this.finalizeKeepingPrompt()) await this.skipSharePrompt();
    await expect(this.reopenButton).toBeVisible();
  }

  /**
   * Finalize and leave the cloud share prompt open. Returns whether the
   * prompt appeared (it does not outside cloud mode).
   */
  async finalizeKeepingPrompt(): Promise<boolean> {
    await this.finalizeButton.click();
    await this.expectStatus('COMPLETED');
    // The modal prompt hides the rest of the page from the accessibility tree.
    await expect(this.reopenButton.or(this.sharePrompt)).toBeVisible();
    return this.sharePrompt.isVisible();
  }

  async skipSharePrompt() {
    await this.sharePromptSkipButton.click();
    await expect(this.sharePrompt).toBeHidden();
  }

  /** Accept the share prompt; opens the share dialog with a fresh link. */
  async shareFromPrompt() {
    await this.sharePromptShareButton.click();
    await this.shareDialog.expectOpen();
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
