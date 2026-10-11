import {
  ApiaryDetailPage,
  ApiaryFormPage,
  ApiaryListPage,
  ApiarySwitcher,
} from 'page-objects';
import { DEFAULT_APIARY_NAME, expect, test, uniqueName } from '../fixtures';

/**
 * `/apiaries` → detail (tabs) → "Edit Apiary" → rename → back on detail with
 * the switcher showing the new name. The Location tab is a Leaflet map whose
 * tiles are blocked by the auto fixture, so it is only asserted as a tab.
 */
test.describe('Apiaries', { tag: ['@core'] }, () => {
  test('lists the default apiary, opens its detail and renames it', async ({
    page,
    freshUser,
  }) => {
    const newName = uniqueName('Renamed Apiary');
    const list = new ApiaryListPage(page);
    const detail = new ApiaryDetailPage(page);
    const form = new ApiaryFormPage(page);
    const switcher = new ApiarySwitcher(page);

    await list.goto();
    await expect(list.row(DEFAULT_APIARY_NAME)).toBeVisible();

    await list.openDetails(DEFAULT_APIARY_NAME);
    await expect(page).toHaveURL(
      new RegExp(`/apiaries/${freshUser.apiaryId}$`),
    );
    await expect(detail.heading(DEFAULT_APIARY_NAME)).toBeVisible();
    for (const tab of ['Overview', 'Hives', 'Location']) {
      await expect(detail.tab(tab)).toBeVisible();
    }

    await detail.editApiaryButton.click();
    await expect(page).toHaveURL(
      new RegExp(`/apiaries/${freshUser.apiaryId}/edit$`),
    );
    await expect(form.nameInput).toHaveValue(DEFAULT_APIARY_NAME);
    await form.fillApiaryForm({ name: newName });
    await form.submitForm();

    await expect(page).toHaveURL(
      new RegExp(`/apiaries/${freshUser.apiaryId}$`),
    );
    await expect(detail.heading(newName)).toBeVisible();
    await switcher.expectActive(newName);
  });
});
