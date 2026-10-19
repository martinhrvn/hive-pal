import { Locator, Page, expect } from '@playwright/test';

/**
 * "Quick Check" dialog: observation and reminder tags plus an optional note,
 * opened from the "Add Entry" menu of a hive's (or the apiary's) timeline.
 */
export class QuickCheckDialog {
  readonly page: Page;
  /** "Add Entry" menu in the timeline header. */
  readonly addEntryButton: Locator;
  readonly menuItem: Locator;
  readonly dialog: Locator;
  /** The "Reminders" tags (needs super, low stores, …). */
  readonly reminderTags: Locator;
  readonly noteInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addEntryButton = page.getByRole('button', { name: 'Add Entry' });
    this.menuItem = page.getByRole('menuitem', { name: 'Quick Check' });
    this.dialog = page.getByRole('dialog', { name: 'Quick Check' });
    this.reminderTags = this.dialog
      .getByText('Reminders', { exact: true })
      .locator('..');
    this.noteInput = this.dialog.getByPlaceholder('What did you observe?');
    this.saveButton = this.dialog.getByRole('button', {
      name: 'Save Quick Check',
    });
  }

  /** A tag by its label (e.g. "Calm", "Needs Super"); click to toggle it. */
  tag(label: string): Locator {
    return this.dialog.getByText(label, { exact: true });
  }

  async open() {
    await this.addEntryButton.click();
    await this.menuItem.click();
    await expect(this.dialog).toBeVisible();
  }

  async toggleTags(...labels: string[]) {
    for (const label of labels) await this.tag(label).click();
  }

  async fillNote(text: string) {
    await this.noteInput.fill(text);
  }

  async save() {
    await this.saveButton.click();
    await expect(this.dialog).toBeHidden();
  }

  /** A saved quick check in the timeline, found by its note. */
  timelineEntry(note: string): Locator {
    return this.page.getByText(note, { exact: true }).locator('../..');
  }
}
