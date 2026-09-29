import { test, expect } from './fixtures';
import { Page } from '@playwright/test';
import { ApiaryFormPage } from 'page-objects';
import { generateRandomString } from './utils';

/**
 * Phase 2 coverage for the cross-apiary "view all" mode on the Todos page.
 *
 * Todos are created in two different apiaries (single-apiary mode each time),
 * then we verify that a single apiary filters the /todos list while
 * "All apiaries" shows todos from every apiary.
 *
 * Requires a running stack (frontend + backend + database).
 * Run with: `BASE_URL=... pnpm --filter e2e test view-all-phase2`.
 */

const clickSwitcherItem = async (
  page: Page,
  item: ReturnType<Page['locator']>,
) => {
  await page.waitForLoadState('networkidle').catch(() => {});
  for (let attempt = 0; attempt < 5; attempt++) {
    await page.getByTestId('apiary-switcher').click();
    try {
      await item.click({ timeout: 3000 });
      return;
    } catch {
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(300);
    }
  }
  throw new Error('Could not click switcher item');
};

const selectApiary = (page: Page, name: string) =>
  clickSwitcherItem(
    page,
    page.getByRole('menuitem', { name: new RegExp(name) }),
  );

const selectAllApiaries = (page: Page) =>
  clickSwitcherItem(page, page.getByTestId('apiary-switcher-all'));

const addTodo = async (page: Page, title: string) => {
  await page.goto('/todos', { waitUntil: 'commit' });
  const input = page.getByPlaceholder(/Add a todo/);
  await input.click();
  await input.fill(title);
  await input.press('Enter');
  await expect(page.getByText(title).first()).toBeVisible();
};

test.describe('View all apiaries — Phase 2 (Todos)', () => {
  test('disabling the apiary filter shows todos from every apiary', async ({
    page,
  }) => {
    const suffix = Date.now().toString().slice(-5);
    const apiaryA = 'My Apiary'; // auto-created default apiary
    const apiaryB = `Ridge Bravo ${suffix}`;
    const todoA = `Todo Anna ${suffix}`;
    const todoB = `Todo Boris ${suffix}`;

    await page.route('**/*', route => {
      const url = route.request().url();
      if (!url.startsWith('http://localhost:5173')) return route.abort();
      if (/\/api\/(weather|hivescale)/.test(url)) return route.abort();
      return route.continue();
    });

    // --- Register a brand-new user ---
    const email = `phase2-${Date.now()}@example.com`;
    const password = generateRandomString();
    await page.goto('/register', { waitUntil: 'commit' });
    await page.getByLabel('email').fill(email);
    await page
      .getByRole('textbox', { name: 'Password', exact: true })
      .fill(password);
    await page
      .getByRole('textbox', { name: 'Confirm Password' })
      .fill(password);
    await page.getByRole('textbox', { name: 'Display Name' }).fill('Phase Two');
    await page
      .getByRole('checkbox', { name: 'I agree to the Privacy Policy' })
      .click();
    await page.getByRole('button', { name: /register/i }).click();
    await page.waitForURL(u => !u.pathname.startsWith('/register'), {
      timeout: 15000,
    });

    // --- Add a todo to the default apiary ---
    await page.goto('/todos', { waitUntil: 'commit' });
    await expect(page.getByTestId('apiary-switcher')).toBeVisible({
      timeout: 15000,
    });
    await addTodo(page, todoA);

    // --- Create a second apiary, make it active, add a todo there ---
    const apiaryForm = new ApiaryFormPage(page);
    await page.goto('/apiaries/create', { waitUntil: 'commit' });
    await apiaryForm.fillApiaryForm({ name: apiaryB });
    await apiaryForm.submitForm();
    await selectApiary(page, apiaryB);
    await addTodo(page, todoB);

    // --- Single apiary: /todos is filtered to that apiary ---
    await page.goto('/todos', { waitUntil: 'commit' });
    await selectApiary(page, apiaryA);
    await expect(page.getByText(todoA).first()).toBeVisible();
    await expect(page.getByText(todoB)).toHaveCount(0);
    // Caption reflects the single-apiary scope.
    await expect(
      page.getByText('Keep track of tasks for this apiary.'),
    ).toBeVisible();

    // --- "All apiaries": /todos shows todos from every apiary ---
    await selectAllApiaries(page);
    await expect(page.getByText(todoA).first()).toBeVisible();
    await expect(page.getByText(todoB).first()).toBeVisible();
    // Caption switches to the cross-apiary wording.
    await expect(
      page.getByText('Keep track of tasks for all apiaries.'),
    ).toBeVisible();

    // --- Phase 3: the dashboard aggregates todos across apiaries in view-all
    // mode, and the empty hives state uses scope-aware wording. ---
    await page.getByRole('button', { name: 'Dashboard' }).click();
    await expect(page.getByText(todoA).first()).toBeVisible();
    await expect(page.getByText(todoB).first()).toBeVisible();
    await expect(
      page.getByText(
        'Add a hive to any of your apiaries to start tracking it.',
      ),
    ).toBeVisible();
  });
});
