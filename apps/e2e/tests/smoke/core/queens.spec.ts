import { HiveDetailPage, QueenFormPage } from 'page-objects';
import { expect, test, uniqueName } from '../fixtures';

/** Hive detail → "Add Queen" → create → "Queen History" tab → `/queens` list. */
test.describe('Queens', { tag: ['@core'] }, () => {
  test('user can add a queen to a hive and see it in the history and list', async ({
    page,
    freshUser,
  }) => {
    const hiveName = uniqueName('Queen Hive');
    const hive = await freshUser.api.createHive({ name: hiveName });
    const year = new Date().getFullYear();

    const hiveDetail = new HiveDetailPage(page);
    const queenForm = new QueenFormPage(page);

    await test.step('open the queen form from the hive page', async () => {
      await hiveDetail.goto(hive.id);
      await expect(hiveDetail.heading(hiveName)).toBeVisible();
      await hiveDetail.addQueenButton.click();
      await expect(page).toHaveURL(
        new RegExp(`/hives/${hive.id}/queens/create$`),
      );
    });

    await test.step('create the queen', async () => {
      await queenForm.fillYear(year);
      await queenForm.submitCreate();
      await expect(page).toHaveURL(new RegExp(`/hives/${hive.id}$`));
    });

    await test.step('queen history lists the new queen', async () => {
      await hiveDetail.tab('Queen History').click();
      await expect(
        page.getByRole('link', { name: `Queen ${year}` }),
      ).toBeVisible();
    });

    await test.step('the queens page lists it with the hive name', async () => {
      await page.goto('/queens');
      await expect(page.getByRole('heading', { name: 'Queens' })).toBeVisible();
      const row = page.getByRole('row').filter({ hasText: `Queen ${year}` });
      await expect(row).toContainText(hiveName);
    });
  });
});
