import { Locator, Page, expect } from '@playwright/test';

/**
 * `/hives/:id/inspect/mobile`: the step-by-step inspection for phones
 * (Strength & Brood, Stores, Queen, Media & Notes, Review), opened with
 * "Mobile Inspection" in the hive's actions.
 */
export class MobileWizardPage {
  readonly page: Page;
  /** The segmented bar at the top, one button per step. */
  readonly progress: Locator;
  readonly continueButton: Locator;
  readonly backButton: Locator;
  readonly saveButton: Locator;
  readonly addPhotoButton: Locator;
  readonly notesInput: Locator;
  /** The "Ready to save" banner on the review step. */
  readonly readyToSave: Locator;

  constructor(page: Page) {
    this.page = page;
    this.progress = page
      .getByRole('button', { name: 'Go to step 1' })
      .locator('..');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.backButton = page.getByRole('button', { name: 'Back' });
    this.saveButton = page.getByRole('button', { name: 'Save inspection' });
    this.addPhotoButton = page.getByRole('button', { name: 'Add photo' });
    this.notesInput = page.getByPlaceholder('Anything else worth remembering?');
    this.readyToSave = page.getByText('Ready to save', { exact: true });
  }

  /** The step's title ("Stores", "Queen", …). */
  step(title: string): Locator {
    return this.page.getByRole('heading', { level: 2, name: title });
  }

  /** A counter (frame counter or tap scale) by its label, e.g. "Honey Stores". */
  counter(label: string): Locator {
    return this.page.getByText(label, { exact: true }).locator('../..');
  }

  /** Tap + on a counter `times` times. */
  async increase(label: string, times: number) {
    const plus = this.counter(label).getByRole('button', { name: 'Increase' });
    for (let i = 0; i < times; i++) await plus.click();
  }

  /** A tile or toggle on the queen step: "Seen", "Not seen", "Swarm cells", … */
  choice(label: string): Locator {
    return this.page.getByRole('button', { name: label, exact: true });
  }

  async next(title: string) {
    await this.continueButton.click();
    await expect(this.step(title)).toBeVisible();
  }

  async addPhoto(file: string) {
    const chooser = this.page.waitForEvent('filechooser');
    await this.addPhotoButton.click();
    await (await chooser).setFiles(file);
    await expect(
      this.page.getByRole('button', { name: 'Remove photo' }),
    ).toBeVisible();
  }

  /** Save and wait for the new inspection's page. */
  async save() {
    await this.saveButton.click();
    await this.page.waitForURL(/\/inspections\/[^/]+$/);
  }
}
