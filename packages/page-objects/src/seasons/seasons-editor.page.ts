import { expect, Locator, Page } from '@playwright/test';

/**
 * The seasons schedule editor: the year strip, the season list, the
 * year-round interval and the "Apply to all hives" action. It is the apiary's
 * Seasons tab, and also what a hive's Settings tab shows once that hive owns
 * its seasons. Pass the tab panel that holds it as `root`.
 */
export class SeasonsEditorPageObject {
  readonly page: Page;
  readonly root: Locator;
  /** The card holding the whole editor. */
  readonly card: Locator;
  /** The card's introduction. */
  readonly description: Locator;
  /** The year as one strip; each season is a coloured segment. */
  readonly yearStrip: Locator;
  /** The colour key under the strip. */
  readonly stripKey: Locator;
  /** The "Year-round" block, for days no season covers. */
  readonly yearRoundSection: Locator;
  readonly yearRoundInterval: Locator;
  /** Every season row (the open one is an editor, the rest are summaries). */
  readonly seasonRows: Locator;
  /** "Add season", below the list. */
  readonly addSeasonButton: Locator;
  readonly saveButton: Locator;
  /** Copies the schedule into every hive in the apiary. */
  readonly applyButton: Locator;
  readonly applyDialog: Locator;
  readonly applyDialogDescription: Locator;
  readonly applyConfirmButton: Locator;
  /** The season currently open for editing. */
  readonly editor: Locator;
  readonly editorNameInput: Locator;
  readonly editorStartButton: Locator;
  readonly editorEndButton: Locator;
  readonly editorInspectionsSwitch: Locator;
  readonly editorInspectionInterval: Locator;
  readonly editorFeedingSwitch: Locator;
  readonly editorFeedingTarget: Locator;
  readonly editorDoneButton: Locator;

  constructor(page: Page, root: Locator = page.getByRole('tabpanel')) {
    this.page = page;
    this.root = root;
    this.card = root.locator('[data-slot="card"]').first();
    this.description = this.card.getByText(/Set the year-round defaults/);
    this.yearStrip = root.locator('[data-test="season-year-strip"]');
    this.stripKey = root.locator('[data-test="strip-key"]');
    this.yearRoundSection = root.locator('section').filter({
      has: page.getByRole('heading', { name: 'Year-round', exact: true }),
    });
    this.yearRoundInterval = this.yearRoundSection.getByLabel(
      'Inspection interval (days)',
    );
    this.seasonRows = root.locator('[data-test="season-card"]');
    this.addSeasonButton = root.getByRole('button', {
      name: 'Add season',
      exact: true,
    });
    this.saveButton = root.getByRole('button', { name: 'Save seasons' });
    this.applyButton = root.getByRole('button', {
      name: 'Apply to all hives',
    });
    this.applyDialog = page.getByRole('dialog');
    this.applyDialogDescription = this.applyDialog.getByText(
      /This replaces every hive/,
    );
    this.applyConfirmButton = this.applyDialog.getByRole('button', {
      name: 'Apply to all hives',
    });
    this.editor = this.seasonRows.filter({
      has: page.getByLabel('Name', { exact: true }),
    });
    this.editorNameInput = this.editor.getByLabel('Name', { exact: true });
    this.editorStartButton = this.editor.getByLabel('Starts', { exact: true });
    this.editorEndButton = this.editor.getByLabel('Ends', { exact: true });
    this.editorInspectionsSwitch = this.editor.locator(
      '[data-test="season-inspections"]',
    );
    this.editorInspectionInterval = this.editor.getByLabel(
      'Inspection interval (days)',
    );
    this.editorFeedingSwitch = this.editor.locator(
      '[data-test="season-feeding"]',
    );
    this.editorFeedingTarget = this.editor.getByLabel(
      'Feeding target (kg sugar)',
    );
    this.editorDoneButton = this.editor.locator('[data-test="done-season"]');
  }

  /** A season segment on the year strip, by its display name. */
  stripSeason(name: string): Locator {
    return this.yearStrip.getByRole('button', { name, exact: true });
  }

  /**
   * The uncovered days on the strip. Clicking either half adds one season
   * covering the whole gap, even when it runs across the new year.
   */
  get stripYearRound(): Locator {
    return this.yearStrip
      .getByRole('button', { name: 'Add season here' })
      .first();
  }

  /** A season row by its name, whether collapsed or open in the editor. */
  seasonRow(name: string): Locator {
    return this.seasonRows.filter({ hasText: name });
  }

  /** Open a season in the editor, as clicking its row does. */
  async openSeason(name: string) {
    await this.seasonRow(name).locator('[data-test="edit-season"]').click();
  }

  /** Fill the longest uncovered stretch with a new season. */
  async addSeasonFromStrip() {
    await this.stripYearRound.click();
  }

  async setYearRoundInterval(days: number) {
    await this.yearRoundInterval.fill(String(days));
  }

  async nameSeason(name: string) {
    await this.editorNameInput.fill(name);
  }

  /** Turn inspections on or off for the season open in the editor. */
  async setInspections(on: boolean) {
    const checked =
      (await this.editorInspectionsSwitch.getAttribute('aria-checked')) ===
      'true';
    if (checked !== on) await this.editorInspectionsSwitch.click();
  }

  /** Fold the open season back into the list. */
  async doneEditing() {
    await this.editorDoneButton.click();
  }

  /** Save the schedule and wait for the API call. */
  async save() {
    const saved = this.page.waitForResponse(
      res =>
        /\/api\/(?:apiaries|hives)\/[^/?]+$/.test(res.url()) &&
        res.request().method() === 'PATCH',
    );
    await this.saveButton.click();
    await saved;
  }

  /** Open the "Apply to all hives" confirmation. */
  async openApplyDialog() {
    await this.applyButton.click();
    await expect(this.applyDialog).toBeVisible();
  }

  /** Confirm the bulk apply and wait for the API call. */
  async confirmApply() {
    const applied = this.page.waitForResponse(
      res =>
        /\/api\/apiaries\/[^/]+\/seasons\/apply$/.test(res.url()) &&
        res.request().method() === 'POST',
    );
    await this.applyConfirmButton.click();
    await applied;
  }
}
