import {test, expect } from "@playwright/test";
import {createScreenshotHelper} from "./screenshot-helper";


const takeScreenshot = createScreenshotHelper({ projectName: 'admin' });

test('Admin can log in', async ({ page,  }) => {
    await page.goto('/login')
    await takeScreenshot(page, 'login')
    await page.getByLabel('email').fill(process.env.ADMIN_EMAIL)
    await page.getByLabel('password').fill(process.env.ADMIN_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByRole('heading', { name: 'Hive Pal' })).toBeVisible()
    await takeScreenshot(page, 'admin-dashboard')
})

test('Admin can view users', async ({ page }) => {
    await page.goto('/users')
    await takeScreenshot(page, 'users')
    await
    await expect(page).toHaveURL('/users')
    await expect(page.getByText('Users')).toHaveText('Users')
})