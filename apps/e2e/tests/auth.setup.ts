import { test as setup, expect } from '@playwright/test';
import { generateRandomString } from './utils';
const adminFile = 'playwright/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto('/login');
  await page.getByLabel('email').fill(process.env.ADMIN_EMAIL);
  await page.getByLabel('password').fill(process.env.ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('heading', { name: 'Hive Pal' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
  await page.context().storageState({ path: adminFile });
});

const userFile = 'playwright/.auth/user.json';

setup('authenticate as user', async ({ page, isMobile }) => {
  await page.goto('/login');
  const email = `test-${Date.now()}@example.com`;
  const password = generateRandomString();

  await page.getByRole('link', { name: 'Sign Up' }).click();
  await page.getByLabel('email').fill(email);
  await page
    .getByRole('textbox', { name: 'Password', exact: true })
    .fill(password);
  await page.getByRole('textbox', { name: 'Confirm Password' }).fill(password);
  await page
    .getByRole('textbox', { name: 'Display Name' })
    .fill('Peter Parker');
  await page.getByRole('checkbox', { name: 'I agree to the Privacy Policy' }).click();
  await page.getByRole('button', { name: /register/i }).click();

  await expect(page.getByText('Welcome to Hive-Pal!')).toBeVisible();

  await page.context().storageState({ path: userFile });
});
