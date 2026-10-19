import { Locator, Page } from '@playwright/test';

export class ApiaryFormPage {
  private readonly page: Page;
  readonly nameInput: Locator;
  readonly locationInput: Locator;
  readonly mapContainer: Locator;
  /** "Data Driven" or "Subjective" inspections for this apiary. */
  readonly inspectionTypeSelect: Locator;
  readonly cancelButton: Locator;
  /** "Create Apiary" on the create page, "Edit Apiary" on the edit page. */
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByLabel('Name');
    this.locationInput = page.getByLabel('Location');
    this.mapContainer = page.locator('.leaflet-container');
    this.inspectionTypeSelect = page.getByRole('combobox', {
      name: 'Inspection Type',
    });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.submitButton = page.getByRole('button', {
      name: /^(Create|Edit) Apiary$/,
    });
  }

  async fillApiaryForm({
    name,
    location,
    setMapLocation = false,
  }: {
    name: string;
    location?: string;
    setMapLocation?: boolean;
  }) {
    await this.nameInput.fill(name);

    if (location) {
      await this.locationInput.fill(location);
    }

    if (setMapLocation) {
      // Click on the map to set a location (needs map tiles; avoid in smoke tests)
      await this.mapContainer.click({ position: { x: 100, y: 100 } });
    }
  }

  /** Click the middle of the map to drop the location pin there. */
  async dropPin() {
    await this.mapContainer.click();
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async cancelForm() {
    await this.cancelButton.click();
  }

  async createApiary(data: {
    name: string;
    location?: string;
    setMapLocation?: boolean;
  }) {
    await this.fillApiaryForm(data);
    await this.submitForm();
  }
}
