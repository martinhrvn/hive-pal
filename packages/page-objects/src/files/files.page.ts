import { Locator, Page } from '@playwright/test';

export type FileTypeFilter = 'All Files' | 'Photos' | 'Documents' | 'Audio';

/**
 * The `/files` page. The type filter is a Select with no label; it is found
 * by the option text it currently shows, so `typeFilter` tracks the selected
 * value.
 */
export class FilesPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emptyState: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Files' });
    this.emptyState = page.getByText('No files uploaded yet');
    this.searchInput = page.getByPlaceholder('Search files...');
  }

  async goto() {
    await this.page.goto('/files');
  }

  /** The type filter trigger, showing the currently selected option. */
  typeFilter(current: FileTypeFilter = 'All Files'): Locator {
    return this.page.getByRole('combobox').filter({ hasText: current });
  }

  async selectType(
    label: FileTypeFilter,
    current: FileTypeFilter = 'All Files',
  ) {
    await this.typeFilter(current).click();
    await this.page.getByRole('option', { name: label }).click();
  }
}
