import { FilesPage } from 'page-objects';
import { expect, test } from '../fixtures';

test.describe('Files', { tag: ['@core'] }, () => {
  test('empty state renders and the type filter switches to Photos', async ({
    page,
    freshUser,
  }) => {
    void freshUser;
    const files = new FilesPage(page);

    await test.step('open /files and see the empty state', async () => {
      await files.goto();
      await expect(files.heading).toBeVisible();
      await expect(files.emptyState).toBeVisible();
    });

    await test.step('filter by Photos', async () => {
      await expect(files.typeFilter('All Files')).toBeVisible();
      await files.selectType('Photos');
      await expect(files.typeFilter('Photos')).toBeVisible();
      await expect(files.emptyState).toBeVisible();
    });
  });
});
