import {
  InspectionDetailPage,
  InspectionFormPage,
  InspectionListPage,
} from 'page-objects';
import { expect, test, uniqueName } from '../fixtures';

test.describe('Inspections', { tag: ['@core'] }, () => {
  test('lists a completed inspection, opens it and edits the notes', async ({
    page,
    freshUser,
  }) => {
    const hiveName = uniqueName('Hive Clara');
    const hive = await freshUser.api.createHive({ name: hiveName });
    await freshUser.api.createInspection({
      hiveId: hive.id,
      notes: 'Seeded by the smoke test',
    });

    const list = new InspectionListPage(page);
    const detail = new InspectionDetailPage(page);
    const form = new InspectionFormPage(page);

    await list.goto();
    await expect(list.hiveColumnHeader).toBeVisible();
    await expect(list.row(hiveName).first()).toBeVisible();

    await list.view(hiveName);
    await expect(page).toHaveURL(/\/inspections\/[0-9a-f-]+$/);
    await expect(detail.heading(hiveName)).toBeVisible();
    await expect(page.getByText('Seeded by the smoke test')).toBeVisible();

    await detail.editButton.click();
    await expect(page).toHaveURL(/\/inspections\/[0-9a-f-]+\/edit$/);
    await form.fillNotes('Edited by the smoke test');
    await form.save();
    await expect(page).toHaveURL(/\/inspections\/[0-9a-f-]+$/);
    await expect(page.getByText('Edited by the smoke test')).toBeVisible();
  });

  test('creates an inspection from the generic create page', async ({
    page,
    freshUser,
  }) => {
    const hiveName = uniqueName('Hive Dora');
    await freshUser.api.createHive({ name: hiveName });
    const form = new InspectionFormPage(page);

    await page.goto('/inspections/create');
    await form.selectHive(hiveName);
    await form.fillNotes('Created from /inspections/create');
    await form.save();
    await expect(page).toHaveURL(/\/inspections\/[0-9a-f-]+$/);
    await expect(
      page.getByText('Created from /inspections/create'),
    ).toBeVisible();
  });
});
