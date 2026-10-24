import { expect, Locator, Page } from '@playwright/test';

/**
 * Main navigation in the sidebar (`data-sidebar="sidebar"`). Top-level entries
 * render as buttons or links depending on whether they have sub-items, so
 * both roles are matched.
 */
export class AppSidebar {
  readonly page: Page;
  readonly root: Locator;
  /** Header button that folds the sidebar down to icons, and back. */
  readonly toggle: Locator;
  /** Desktop sidebar; `data-state` is `expanded` or `collapsed`. */
  private readonly frame: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator('[data-sidebar="sidebar"]');
    this.toggle = page.locator('[data-sidebar="trigger"]');
    this.frame = page.locator('[data-slot="sidebar"][data-state]');
  }

  nav(label: string): Locator {
    return this.root
      .getByRole('link', { name: label, exact: true })
      .or(this.root.getByRole('button', { name: label, exact: true }))
      .first();
  }

  /** A hive's link in the sidebar's "Hives" list. */
  hive(name: string): Locator {
    return this.root.getByRole('link', { name, exact: true }).first();
  }

  async open(label: string) {
    await this.nav(label).click();
  }

  /** Fold the sidebar down to icons, for more room. The app remembers it. */
  async collapse() {
    await this.setExpanded(false);
  }

  async expand() {
    await this.setExpanded(true);
  }

  private async setExpanded(expanded: boolean) {
    const state = expanded ? 'expanded' : 'collapsed';
    if ((await this.frame.getAttribute('data-state')) === state) return;
    await this.toggle.click();
    await expect(this.frame).toHaveAttribute('data-state', state);
  }
}
