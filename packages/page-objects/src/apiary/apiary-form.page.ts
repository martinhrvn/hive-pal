import { Locator, Page } from '@playwright/test';

export class ApiaryFormPage {
  private readonly page: Page;
  readonly nameInput: Locator;
  readonly locationInput: Locator;
  readonly mapContainer: Locator;
  readonly cancelButton: Locator;
  /** "Create Apiary" on the create page, "Edit Apiary" on the edit page. */
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByLabel('Name');
    this.locationInput = page.getByLabel('Location');
    this.mapContainer = page.locator('.leaflet-container');
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
