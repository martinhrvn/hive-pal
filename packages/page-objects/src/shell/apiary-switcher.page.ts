import { expect, Locator, Page } from '@playwright/test';

/**
 * The apiary switcher in the sidebar (`data-testid="apiary-switcher"`).
 *
 * Selecting an apiary invalidates every query, and the resulting re-render can
 * detach the freshly opened dropdown mid-click, so clicks are retried.
 */
export class ApiarySwitcher {
  readonly page: Page;
  readonly trigger: Locator;
  readonly allApiariesItem: Locator;

  constructor(page: Page) {
    this.page = page;
    this.trigger = page.getByTestId('apiary-switcher');
    this.allApiariesItem = page.getByTestId('apiary-switcher-all');
  }

  item(name: string | RegExp): Locator {
    return this.page.getByRole('menuitem', { name });
  }

  /** Make the named apiary the active one. */
  async select(name: string) {
    await this.clickItem(this.item(new RegExp(escapeRegExp(name))));
  }

  /** Switch to the cross-apiary "All apiaries" view. */
  async selectAll() {
    await this.clickItem(this.allApiariesItem);
  }

  /** Open the menu and assert each name is listed, then close it again. */
  async expectItems(names: string[]) {
    await this.trigger.click();
    for (const name of names) {
      await expect(this.item(new RegExp(escapeRegExp(name)))).toBeVisible();
    }
    await this.page.keyboard.press('Escape');
  }

  /** The trigger shows the active apiary's name. */
  async expectActive(name: string) {
    await expect(this.trigger).toContainText(name);
  }

  private async clickItem(item: Locator) {
    await this.page.waitForLoadState('networkidle').catch(() => {});
    for (let attempt = 0; attempt < 5; attempt++) {
      await this.trigger.click();
      try {
        await item.click({ timeout: 3000 });
        return;
      } catch {
        // menu closed / re-rendered: dismiss, settle, and retry
        await this.page.keyboard.press('Escape').catch(() => {});
        await this.page.waitForLoadState('networkidle').catch(() => {});
        await this.page.waitForTimeout(300);
      }
    }
    throw new Error('Could not click apiary switcher item');
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
