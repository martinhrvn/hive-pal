import { Locator, Page } from '@playwright/test';

/** The round "+" button in the bottom-right corner of every app page. */
export class FloatingActionButton {
  readonly page: Page;
  readonly root: Locator;
  /** Opens and closes the menu ("Open quick actions" / "Close quick actions"). */
  readonly toggle: Locator;
  /** The panel with the shortcuts, shown while the menu is open. */
  readonly actions: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId('fab');
    this.toggle = this.root.getByRole('button', {
      name: /^(Open|Close) quick actions$/,
    });
    this.actions = this.root.getByTestId('fab-actions');
  }

  /** A shortcut in the open menu, e.g. "Add Inspection" or "Scan QR Code". */
  action(label: string): Locator {
    return this.actions.getByRole('button', { name: label, exact: true });
  }

  async open() {
    await this.root.getByRole('button', { name: 'Open quick actions' }).click();
  }

  async close() {
    await this.root
      .getByRole('button', { name: 'Close quick actions' })
      .click();
  }
}
