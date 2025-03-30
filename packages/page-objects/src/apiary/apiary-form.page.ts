import { Locator, Page } from '@playwright/test';
import { TEST_SELECTORS } from '../utils';

export class ApiaryFormPage {
  private readonly page: Page;
  readonly nameInput: Locator;
  readonly locationInput: Locator;
  readonly mapContainer: Locator;
  readonly cancelButton: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByLabel('Name');
    this.locationInput = page.getByLabel('Location');
    this.mapContainer = page.locator('.leaflet-container');
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.submitButton = page.getByRole('button', { name: 'Create Apiary' });
  }

  /**
   * Fill the apiary form with the provided data
   */
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
      // Click on the map to set a location
      await this.mapContainer.click({ position: { x: 100, y: 100 } });
    }
  }

  /**
   * Submit the apiary form
   */
  async submitForm() {
    await this.submitButton.click();
  }

  /**
   * Cancel form submission
   */
  async cancelForm() {
    await this.cancelButton.click();
  }

  /**
   * Fill and submit the apiary form
   */
  async createApiary({
    name,
    location,
    setMapLocation = false,
  }: {
    name: string;
    location?: string;
    setMapLocation?: boolean;
  }) {
    await this.fillApiaryForm({ name, location, setMapLocation });
    await this.submitForm();
  }
}