import { Locator, Page, expect } from '@playwright/test';

/**
 * "Add Actions" dialog: feedings, treatments, frames and notes logged
 * without an inspection, opened with "Add Entry" → "Action" in a hive's
 * timeline.
 */
export class AddActionDialog {
  readonly page: Page;
  /** "Add Entry" menu in the timeline header. */
  readonly addEntryButton: Locator;
  readonly menuItem: Locator;
  readonly dialog: Locator;
  /** The treatment form's product picker. */
  readonly productSelect: Locator;
  readonly amountInput: Locator;
  /** Confirms the treatment form, before the dialog's own save. */
  readonly treatmentSaveButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addEntryButton = page.getByRole('button', { name: 'Add Entry' });
    this.menuItem = page.getByRole('menuitem', { name: 'Action' });
    this.dialog = page.getByRole('dialog', { name: 'Add Actions' });
    this.productSelect = this.dialog.locator(
      '[data-test="treatment-product-select"]',
    );
    this.amountInput = this.dialog.getByRole('spinbutton', { name: 'Amount' });
    this.treatmentSaveButton = this.dialog.locator(
      '[data-test="treatment-save"]',
    );
    this.saveButton = this.dialog.getByRole('button', { name: 'Save Actions' });
  }

  async open() {
    await this.addEntryButton.click();
    await this.menuItem.click();
    await expect(this.dialog).toBeVisible();
  }

  /** An action type button: "Feeding", "Treatment", "Frames", … */
  actionType(name: string): Locator {
    return this.dialog.getByRole('button', { name, exact: true });
  }

  async pickProduct(name: string) {
    await this.productSelect.click();
    await this.page.getByRole('option', { name, exact: true }).click();
  }

  async fillAmount(amount: number) {
    await this.amountInput.fill(String(amount));
  }

  async save() {
    await this.saveButton.click();
    await expect(this.dialog).toBeHidden();
  }

  /** The treatment on the timeline: "Treated with Oxalic Acid (2 g)". */
  timelineTreatment(product: string): Locator {
    return this.page.getByText(new RegExp(`^Treated with ${product} \\(`));
  }

  /** The hive's "Applied active ingredients" card. */
  get treatmentSummary(): Locator {
    return this.page.locator('[data-test="treatment-summary-card"]');
  }
}
