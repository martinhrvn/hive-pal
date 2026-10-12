import { test } from '../auth/auth.fixture';
import { expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/user.json' });

/**
 * Custom treatment products & cross-product active-ingredient tracking.
 *
 * The built-in catalog is seeded by the database migration, so it is
 * available to every user without any additional setup.
 */
test.describe('Treatment products', () => {
  test('built-in catalog renders products with their composition', async ({
    page,
  }) => {
    await page.goto('/treatment-products');

    await expect(
      page.getByRole('heading', { name: /treatment products/i }),
    ).toBeVisible();

    // VarroMed is a combination product — it must list BOTH active
    // ingredients (oxalic + formic acid). This is the core of the feature:
    // a product is defined by its active-ingredient composition.
    const varroMed = page
      .locator('[data-test="treatment-product-card"]', { hasText: 'VarroMed' })
      .first();
    await expect(varroMed).toBeVisible();
    await expect(varroMed).toContainText(/oxalic/i);
    await expect(varroMed).toContainText(/formic/i);
  });

  test('a user can define a custom product with a composition', async ({
    page,
  }) => {
    await page.goto('/treatment-products');

    const name = `E2E Oxalic 3.5% ${Date.now()}`;

    await page.locator('[data-test="add-treatment-product"]').click();
    await page.locator('[data-test="tp-name"]').fill(name);

    await page.locator('[data-test="tp-add-ingredient"]').click();
    await page.locator('[data-test="tp-ingredient-select"]').first().click();
    await page
      .getByRole('option')
      .filter({ hasText: /oxalic/i })
      .first()
      .click();
    await page.locator('[data-test="tp-conc"]').first().fill('35');

    await page.locator('[data-test="tp-save"]').click();

    // The new product shows up in the user's catalog.
    await expect(
      page
        .locator('[data-test="treatment-product-card"]', { hasText: name })
        .first(),
    ).toBeVisible();
  });
});
