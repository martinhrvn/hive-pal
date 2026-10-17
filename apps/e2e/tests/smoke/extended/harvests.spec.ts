import { HarvestDetailPage, HarvestListPage } from 'page-objects';
import { expect, test, uniqueName } from '../fixtures';

test.describe('Harvests', { tag: ['@extended'] }, () => {
  test('the wizard needs at least one hive and cancelling creates nothing', async ({
    page,
    freshUser,
  }) => {
    const hiveName = uniqueName('Hive Linden');
    await freshUser.api.createHive({ name: hiveName });

    const harvests = new HarvestListPage(page);
    await harvests.goto();
    await expect(harvests.emptyState).toBeVisible();

    const wizard = harvests.wizard;
    await wizard.open();
    await expect(wizard.submitButton).toBeDisabled();
    await expect(wizard.selectionSummary).toHaveText(
      'Selected: 0 hive(s) • 0 total frames',
    );

    await wizard.selectHive({ name: hiveName });
    await expect(wizard.submitButton).toBeEnabled();
    await wizard.hiveCheckbox(hiveName).uncheck();
    await expect(wizard.framesInput(hiveName)).toBeHidden();
    await expect(wizard.submitButton).toBeDisabled();

    await wizard.cancelButton.click();
    await expect(wizard.dialog).toBeHidden();
    await expect(harvests.emptyState).toBeVisible();
    await harvests.expectStat('Total Harvests', '0');
  });

  test('rejects a zero weight and only offers Finalize once a weight is set', async ({
    page,
    freshUser,
  }) => {
    const hiveName = uniqueName('Hive Acacia');
    const hive = await freshUser.api.createHive({ name: hiveName });
    const harvest = await freshUser.api.createHarvest({
      harvestHives: [{ hiveId: hive.id, framesTaken: 4 }],
    });

    const detail = new HarvestDetailPage(page);
    await detail.goto(harvest.id);
    await detail.expectStatus('DRAFT');
    await expect(detail.draftAlert).toBeVisible();
    await expect(detail.finalizeButton).toHaveCount(0);

    await detail.enterWeight(0);
    await expect(page.getByText('Please enter a valid weight')).toBeVisible();
    await detail.expectStatus('DRAFT');
    await expect(detail.weightInput).toBeVisible();

    await detail.weightInput.fill('12');
    await detail.saveWeightButton.click();
    await detail.expectStatus('IN_PROGRESS');
    await expect(detail.distributionRow(hiveName)).toContainText('12.00 kg');
    await expect(detail.finalizeButton).toBeVisible();
  });

  test('a finalized harvest can be reopened and deleted', async ({
    page,
    freshUser,
  }) => {
    const hive = await freshUser.api.createHive({
      name: uniqueName('Hive Meadow'),
    });
    const harvest = await freshUser.api.createHarvest({
      harvestHives: [{ hiveId: hive.id, framesTaken: 2 }],
    });
    await freshUser.api.setHarvestWeight(harvest.id, 5);
    await freshUser.api.finalizeHarvest(harvest.id);

    const detail = new HarvestDetailPage(page);
    await detail.goto(harvest.id);
    await detail.expectStatus('COMPLETED');
    // Finalized harvests are read-only until reopened.
    await expect(detail.setWeightButton).toHaveCount(0);
    await expect(detail.editHivesButton).toHaveCount(0);

    await detail.reopen();
    await expect(detail.editHivesButton).toBeVisible();
    await expect(detail.finalizeButton).toBeVisible();

    await detail.deleteButton.click();
    const confirm = page.getByRole('dialog', { name: 'Delete Harvest?' });
    await confirm.getByRole('button', { name: 'Delete' }).click();
    await expect(page).toHaveURL(/\/harvests$/);

    const harvests = new HarvestListPage(page);
    await expect(harvests.emptyState).toBeVisible();
  });
});
