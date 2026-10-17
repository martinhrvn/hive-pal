import { expect, Locator, Page } from '@playwright/test';

export type HarvestHiveSelection = { name: string; frames?: number };

/** The "Start New Harvest" dialog opened from the harvests page. */
export class HarvestWizard {
  readonly page: Page;
  readonly openButton: Locator;
  readonly dialog: Locator;
  readonly dateButton: Locator;
  readonly hiveList: Locator;
  /** "Selected: N hive(s) • M total frames" */
  readonly selectionSummary: Locator;
  readonly notesInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.openButton = page
      .getByRole('button', { name: 'Start Harvest' })
      .first();
    this.dialog = page.getByRole('dialog', { name: 'Start New Harvest' });
    // The trigger renders the chosen date ("October 17th, 2026").
    this.dateButton = this.dialog.getByRole('button', { name: /\d{4}$/ });
    this.hiveList = this.dialog
      .locator('div.border')
      .filter({ has: page.getByRole('checkbox') });
    this.selectionSummary = this.dialog.getByText(/^Selected:/);
    this.notesInput = this.dialog.getByLabel('Notes (Optional)');
    this.submitButton = this.dialog.getByRole('button', {
      name: 'Start Harvest',
    });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  hiveCheckbox(name: string): Locator {
    return this.dialog.getByRole('checkbox', { name, exact: true });
  }

  /** Frame count input shown next to a selected hive. */
  framesInput(name: string): Locator {
    // `has` is resolved inside each candidate div, so it must not be scoped
    // to the dialog again.
    return this.dialog
      .locator('div')
      .filter({
        has: this.page.getByRole('checkbox', { name, exact: true }),
      })
      .last()
      .getByRole('spinbutton');
  }

  async open() {
    await this.openButton.click();
    await expect(this.dialog).toBeVisible();
  }

  async selectHive({ name, frames }: HarvestHiveSelection) {
    await this.hiveCheckbox(name).check();
    await expect(this.framesInput(name)).toBeVisible();
    if (frames !== undefined) {
      await this.framesInput(name).fill(String(frames));
      await expect(this.framesInput(name)).toHaveValue(String(frames));
    }
  }

  async fillNotes(notes: string) {
    await this.notesInput.fill(notes);
  }

  /** Submit and wait for the new harvest's detail page; returns its id. */
  async submit(): Promise<string> {
    await this.submitButton.click();
    await expect(this.dialog).toBeHidden();
    await expect(this.page).toHaveURL(/\/harvests\/[0-9a-f-]{36}$/);
    return this.page.url().split('/').pop()!;
  }

  /** Open the wizard, pick hives (and frames), add notes and submit. */
  async startHarvest(options: {
    hives: HarvestHiveSelection[];
    notes?: string;
  }): Promise<string> {
    await this.open();
    for (const hive of options.hives) await this.selectHive(hive);
    if (options.notes) await this.fillNotes(options.notes);
    return this.submit();
  }
}
