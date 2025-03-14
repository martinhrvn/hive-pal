import {expect, test} from "@playwright/test";
import {createScreenshotHelper} from "../screenshot-helper";
import {generateRandomString} from "../utils";


const takeScreenshot = createScreenshotHelper({ projectName: 'auth' });

test('User can sign up', async ({ page, isMobile }) => {
    await page.goto('/login')
    const email = `test-${Date.now()}@example.com`
    const password = generateRandomString()
    await page.getByRole('link', { name: 'Register' }).click()
    await takeScreenshot(page, 'register')
    await page.getByLabel('email').fill(email)
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password)
    await page.getByRole('textbox', { name: 'Confirm Password' }).fill(password)
    await page.getByRole('textbox', { name: 'Display Name' }).fill('Peter Parker')
    await page.getByRole('button', { name: /register/i }).click()

    if (isMobile) {
        await page.getByRole('button', { name: 'Toggle Sidebar' }).click()
    }

    await expect(page.getByText('Peter Parker')).toBeVisible()

    await expect(page).toHaveURL('/apiaries/create')
})