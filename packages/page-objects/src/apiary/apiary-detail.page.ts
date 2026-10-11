import { Locator, Page } from '@playwright/test';

/** `/apiaries/:id` */
export class ApiaryDetailPage {
  readonly page: Page;
  /** "Edit Apiary" in the right-hand action sidebar (owners/editors only). */
  readonly editApiaryButton: Locator;
  readonly deleteApiaryButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.editApiaryButton = page
      .getByRole('button', { name: 'Edit Apiary' })
      .first();
    this.deleteApiaryButton = page
      .getByRole('button', { name: 'Delete Apiary' })
      .first();
  }

  heading(name: string): Locator {
    return this.page.getByRole('heading', { level: 1, name });
  }

  /** Tabs: Overview, Hives, Location, and Sharing (owner only). Location is a Leaflet map. */
  tab(name: string): Locator {
    return this.page.getByRole('tab', { name });
  }

  async goto(apiaryId: string) {
    await this.page.goto(`/apiaries/${apiaryId}`);
  }
}
