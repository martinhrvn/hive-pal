import { HiveDetailPage, HiveFormPage, HiveListPage } from 'page-objects';
import { expect, test, uniqueName } from '../fixtures';

/**
 * `/hives` → detail → "Edit Hive" → change the label → "Save" → heading
 * updated; the "Boxes" tab renders.
 */
test.describe('Hives', { tag: ['@core'] }, () => {
  test('lists a hive, opens it, renames it and shows the Boxes tab', async ({
    page,
    freshUser,
  }) => {
    const hiveName = uniqueName('List Hive');
    const newName = uniqueName('Renamed Hive');
    const hive = await freshUser.api.createHive({ name: hiveName });

    const list = new HiveListPage(page);
    const detail = new HiveDetailPage(page);
    const form = new HiveFormPage(page);

    await list.goto();
    await expect(list.row(hiveName)).toBeVisible();

    await list.openDetails(hiveName);
    await expect(page).toHaveURL(new RegExp(`/hives/${hive.id}$`));
    await expect(detail.heading(hiveName)).toBeVisible();

    await detail.editHiveButton.click();
    await expect(page).toHaveURL(new RegExp(`/hives/${hive.id}/edit$`));
    await expect(form.nameInput).toHaveValue(hiveName);
    await form.nameInput.fill(newName);
    await form.submitForm();

    await expect(page).toHaveURL(new RegExp(`/hives/${hive.id}$`));
    await expect(detail.heading(newName)).toBeVisible();

    await detail.tab('Boxes').click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });
});
