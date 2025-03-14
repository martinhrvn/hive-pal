import {expect, test} from "@playwright/test";
import {generateRandomPassword} from "./utils";
import {createScreenshotHelper} from "./screenshot-helper";


const takeScreenshot = createScreenshotHelper({ projectName: 'auth' });

test('User can sign up', async ({ page }) => {
    await page.goto('/login')
    const email = `test-${Date.now()}@example.com`
    const password = generateRandomPassword()
    await page.getByRole('link', { name: 'Register' }).click()
    await takeScreenshot(page, 'register')
    await page.getByLabel('email').fill(email)
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password)
    await page.getByRole('textbox', { name: 'Confirm Password' }).fill(password)
    await page.getByRole('textbox', { name: 'Display Name' }).fill('Peter Parker')
    await page.getByRole('button', { name: /register/i }).click()

    await expect(page.getByText('Peter Parker')).toBeVisible()

    await expect(page).toHaveURL('/apiaries/create')
})