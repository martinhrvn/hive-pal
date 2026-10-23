import { Locator, Page } from '@playwright/test';

/**
 * The box stack and its properties panel: the Boxes tab on `/hives/:id`, or
 * the simplified builder under "Box Configuration" in the hive form (pass
 * that section as `root`). Boxes are numbered from the bottom, like the
 * app's "Box 1: Brood" labels.
 */
export class BoxEditorPage {
  readonly page: Page;
  readonly root: Locator;
  /** Boxes tab only: switches the stack into edit mode. */
  readonly editButton: Locator;
  readonly addBoxButton: Locator;
  /** Boxes tab only. */
  readonly winterizeAllButton: Locator;
  /** Boxes tab only. */
  readonly saveButton: Locator;
  /** Boxes tab only. */
  readonly cancelButton: Locator;
  /** Fixed strip at the top of the stack. */
  readonly cover: Locator;
  /** Fixed strip at the bottom of the stack. */
  readonly bottomBoard: Locator;
  readonly excluderBar: Locator;
  /** "Box Properties" card (Boxes tab) shown once a box is selected. */
  readonly propertiesPanel: Locator;
  readonly purposeSelect: Locator;
  readonly frameSizeSelect: Locator;
  readonly framesSlider: Locator;
  /** Label above the slider: "Frames: 8 / 10". */
  readonly framesLabel: Locator;
  readonly maxFramesInput: Locator;
  readonly colorInput: Locator;
  readonly colorPresets: Locator;
  readonly excluderCheckbox: Locator;
  readonly winterizedCheckbox: Locator;
  /** Inline form shown after picking "Custom..." as frame size. */
  readonly customSizeName: Locator;
  readonly customSizeWidth: Locator;
  readonly customSizeHeight: Locator;
  readonly customSizeDepth: Locator;
  readonly customSizeCancel: Locator;

  constructor(page: Page, root: Locator = page.getByRole('tabpanel')) {
    this.page = page;
    this.root = root;
    this.editButton = root.getByRole('button', { name: 'Edit Configuration' });
    this.addBoxButton = root.getByRole('button', { name: 'Add Box' });
    this.winterizeAllButton = root.getByRole('button', {
      name: /^(Winterize All|Unwinterize)$/,
    });
    this.saveButton = root.getByRole('button', { name: 'Save', exact: true });
    this.cancelButton = root.getByRole('button', {
      name: 'Cancel',
      exact: true,
    });
    this.cover = root.getByText('Cover', { exact: true }).locator('..');
    this.bottomBoard = root
      .getByText('Bottom Board', { exact: true })
      .locator('..');
    this.excluderBar = root.getByText('Queen Excluder', { exact: true });
    this.propertiesPanel = root
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Box Properties' });
    this.purposeSelect = root.locator('#box-type');
    this.frameSizeSelect = root.locator('#frame-size');
    this.framesSlider = root.getByRole('slider');
    this.framesLabel = root.getByText(/^Frames: \d+ \/ \d+$/);
    this.maxFramesInput = root.locator('#max-frames');
    this.colorInput = root.locator('#box-color');
    this.colorPresets = root
      .getByText('Color Presets', { exact: true })
      .locator('..');
    this.excluderCheckbox = root.locator('#queen-excluder');
    this.winterizedCheckbox = root.locator('#winterized');
    this.customSizeName = root.locator('#fs-name');
    this.customSizeWidth = root.locator('#fs-width');
    this.customSizeHeight = root.locator('#fs-height');
    this.customSizeDepth = root.locator('#fs-depth');
    this.customSizeCancel = this.customSizeName
      .locator('xpath=ancestor::div[contains(@class,"border")][1]')
      .getByRole('button', { name: 'Cancel' });
  }

  /** Box `n`, counted from the bottom (1 = the box on the bottom board). */
  box(n: number): Locator {
    return this.root.getByRole('group', { name: new RegExp(`^Box ${n}:`) });
  }

  /** All boxes in the stack. */
  get boxes(): Locator {
    return this.root.getByRole('group', { name: /^Box \d+:/ });
  }

  async selectBox(n: number) {
    await this.box(n)
      .getByRole('button', { name: /^Select Box/ })
      .click();
  }

  async moveUp(n: number) {
    await this.box(n).getByRole('button', { name: 'Move box up' }).click();
  }

  async moveDown(n: number) {
    await this.box(n).getByRole('button', { name: 'Move box down' }).click();
  }

  async removeBox(n: number) {
    await this.box(n).getByRole('button', { name: 'Remove box' }).click();
  }

  /** English: "Brood Box", "Honey Super", "Feeder Box". */
  async setPurpose(label: string) {
    await this.purposeSelect.click();
    await this.page.getByRole('option', { name: label, exact: true }).click();
  }

  async openFrameSizes() {
    await this.frameSizeSelect.click();
  }

  /** The open frame size list (Built-in / Community / My Sizes / Custom...). */
  get frameSizeList(): Locator {
    return this.page.getByRole('listbox');
  }

  /** Pick a frame size from the open list by the start of its name. */
  async pickFrameSize(name: string) {
    await this.page
      .getByRole('option', { name: new RegExp(`^${escape(name)}`) })
      .click();
  }

  async startCustomSize() {
    await this.openFrameSizes();
    await this.pickFrameSize('Custom...');
  }

  async fillCustomSize(size: {
    name: string;
    width: number;
    height: number;
    depth: number;
  }) {
    await this.customSizeName.fill(size.name);
    await this.customSizeWidth.fill(String(size.width));
    await this.customSizeHeight.fill(String(size.height));
    await this.customSizeDepth.fill(String(size.depth));
  }

  async setMaxFrames(n: number) {
    await this.maxFramesInput.fill(String(n));
  }

  /** Move the frames slider to `n` with the keyboard. */
  async setFrames(n: number) {
    const now = Number(await this.framesSlider.getAttribute('aria-valuenow'));
    await this.framesSlider.focus();
    const key = n > now ? 'ArrowRight' : 'ArrowLeft';
    for (let i = 0; i < Math.abs(n - now); i++)
      await this.page.keyboard.press(key);
  }

  /** A colour swatch, e.g. "#f59e0b". */
  colorPreset(hex: string): Locator {
    return this.colorPresets.getByRole('button', { name: hex });
  }

  /** The wrench on the cover, the bottom board or the selected box. */
  maintenanceButton(on: Locator): Locator {
    return on.getByRole('button', { name: /Maintenance|Cleaned|Replaced/ });
  }

  /** Log "Cleaned" or "Replaced" for the cover or bottom board (saves at once). */
  async logMaintenance(on: Locator, status: 'Cleaned' | 'Replaced') {
    await this.maintenanceButton(on).click();
    const saved = this.page.waitForResponse(
      res =>
        res.url().includes('/api/actions') && res.request().method() === 'POST',
    );
    await this.page
      .getByRole('dialog')
      .getByRole('button', { name: status, exact: true })
      .click();
    await saved;
  }

  async edit() {
    await this.editButton.click();
  }

  /** Save the stack and wait for the API call. */
  async save() {
    const saved = this.page.waitForResponse(
      res =>
        /\/api\/hives\/[^/]+\/boxes/.test(res.url()) &&
        res.request().method() === 'PUT',
    );
    await this.saveButton.click();
    await saved;
  }
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
