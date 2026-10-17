import { expect, Locator, Page } from '@playwright/test';

/**
 * Cloud-only share dialog (`share-dialog.tsx`) for a harvest or inspection:
 * preview image, public link and share targets.
 */
export class ShareDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly previewImage: Locator;
  readonly linkInput: Locator;
  readonly shareTargets: Locator;
  readonly downloadImageButton: Locator;
  readonly revokeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog', { name: 'Share', exact: true });
    this.previewImage = this.dialog.getByRole('img', { name: 'Share preview' });
    this.linkInput = this.dialog.getByRole('textbox');
    this.shareTargets = this.dialog
      .locator('div.grid')
      .filter({ has: page.getByRole('button', { name: 'Facebook' }) });
    this.downloadImageButton = this.dialog.getByRole('button', {
      name: 'Image',
    });
    this.revokeButton = this.dialog.getByRole('button', {
      name: 'Revoke link',
    });
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
    await expect(this.linkInput).toHaveValue(/^https?:\/\/.+/);
  }

  async close() {
    await this.page.keyboard.press('Escape');
    await expect(this.dialog).toBeHidden();
  }
}
