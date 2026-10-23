import { Locator, Page } from '@playwright/test';

/**
 * The right-hand sidebar on `/hives/:id`: active alerts, "Hive Actions" and
 * "Manage Hive", and the dialogs they open (QR code, LLM prompt, archive,
 * delete permanently).
 */
export class HiveActionSidebar {
  readonly page: Page;
  /** "Active Alerts" card; only there while the hive has open alerts. */
  readonly alerts: Locator;
  readonly hiveActions: Locator;
  readonly manageHive: Locator;
  /** Dialog opened by "QR Code". */
  readonly qrDialog: Locator;
  readonly qrTargetSelect: Locator;
  /** Dialog opened by "LLM Prompt". */
  readonly llmDialog: Locator;
  readonly llmPromptText: Locator;
  readonly llmCopyButton: Locator;
  /** Confirmation opened by "Archive Hive". */
  readonly archiveDialog: Locator;
  readonly archiveConfirmButton: Locator;
  /** Type-the-name confirmation opened by "Delete Permanently". */
  readonly deleteDialog: Locator;
  readonly deleteNameInput: Locator;
  readonly deleteConfirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.alerts = sidebarGroup(page, /^Active Alerts/);
    this.hiveActions = sidebarGroup(page, 'Hive Actions');
    this.manageHive = sidebarGroup(page, 'Manage Hive');
    this.qrDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: /^QR Code for / }) });
    this.qrTargetSelect = this.qrDialog.getByRole('combobox');
    this.llmDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: /^LLM Prompt for / }) });
    this.llmPromptText = this.llmDialog.getByRole('textbox');
    this.llmCopyButton = this.llmDialog.getByRole('button', {
      name: /^(Copy to clipboard|Copied)$/,
    });
    this.archiveDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'Archive Hive' }) });
    this.archiveConfirmButton = this.archiveDialog.getByRole('button', {
      name: 'Archive',
      exact: true,
    });
    this.deleteDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', {
        name: 'Delete this hive permanently?',
      }),
    });
    this.deleteNameInput = this.deleteDialog.getByRole('textbox');
    this.deleteConfirmButton = this.deleteDialog.getByRole('button', {
      name: 'Delete hive',
    });
  }

  /** One alert in the "Active Alerts" card, by (part of) its message. */
  alert(text: string | RegExp): Locator {
    return this.alerts
      .locator('div')
      .filter({ hasText: text })
      .filter({ has: this.page.getByRole('button', { name: 'Resolve' }) })
      .last();
  }

  /**
   * A sidebar button by its English label: Add Inspection, Mobile Inspection,
   * Audio Inspection, Schedule Inspection, Add Queen, Split colony, Refresh
   * Data, Edit Hive, QR Code, LLM Prompt, Archive Hive, Delete Permanently.
   */
  action(label: string): Locator {
    return this.page.getByRole('button', { name: label, exact: true }).first();
  }

  async openQrCode() {
    await this.action('QR Code').click();
    await this.qrDialog.waitFor();
  }

  async openLlmPrompt() {
    await this.action('LLM Prompt').click();
    await this.llmDialog.waitFor();
  }

  async copyLlmPrompt() {
    await this.llmCopyButton.click();
  }

  async openDeletePermanently() {
    await this.action('Delete Permanently').click();
    await this.deleteDialog.waitFor();
  }

  async openArchive() {
    await this.action('Archive Hive').click();
    await this.archiveDialog.waitFor();
  }

  /** Close whichever dialog is open with Escape. */
  async closeDialog() {
    await this.page.keyboard.press('Escape');
    await this.page.getByRole('dialog').waitFor({ state: 'hidden' });
  }
}

function sidebarGroup(page: Page, title: string | RegExp): Locator {
  return page.locator('section').filter({
    has: page.getByRole('heading', { name: title, level: 3 }),
  });
}
