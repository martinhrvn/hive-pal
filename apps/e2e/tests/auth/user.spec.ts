import {createScreenshotHelper} from "../screenshot-helper";
import {generateRandomString} from "../utils";
import {test, expect} from "./auth.fixture";


const takeScreenshot = createScreenshotHelper({ projectName: 'auth' });

test('User can sign up', async ({ page, loginPage, signupPage, isMobile }) => {
    await loginPage.goToLogInPage()
    const email = `test-${Date.now()}@example.com`
    const password = generateRandomString()

    await loginPage.registerLink.click()
    await takeScreenshot(page, 'register')

    await signupPage.signUp(email, password, 'Peter Parker')

    if (isMobile) {
        await page.getByRole('button', { name: 'Toggle Sidebar' }).click()
    }

    await expect(page.getByText('Peter Parker')).toBeVisible()

    await expect(page).toHaveURL('/apiaries/create')
})