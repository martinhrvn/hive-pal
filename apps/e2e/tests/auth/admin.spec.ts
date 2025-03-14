import {createScreenshotHelper} from "../screenshot-helper";
import { test , expect} from './auth.fixture'
import {generateRandomString} from "../utils";
import {AuthPage} from "./auth.page";

const takeScreenshot = createScreenshotHelper({ projectName: 'admin' });

test.describe('admin', () => {
    test.use({ storageState: { cookies: [], origins: []} });
    test('Admin can log in', async ({ page,  }) => {
        await page.goto('/login')
        await takeScreenshot(page, 'login')
        await page.getByLabel('email').fill(process.env.ADMIN_EMAIL)
        await page.getByLabel('password').fill(process.env.ADMIN_PASSWORD)
        await page.getByRole('button', { name: /sign in/i }).click()
        await expect(page.getByRole('heading', { name: 'Hive Pal' })).toBeVisible()
        await takeScreenshot(page, 'admin-dashboard')
    })
})


test.use({ storageState: 'playwright/.auth/admin.json' });
test('Admin can view users', async ({ page, authPage, isMobile }) => {

    page.goto('/')
    await takeScreenshot(page, 'users')
    console.log('isMobile', isMobile)
    if (isMobile) {
        await page.getByRole('button', { name: 'Toggle Sidebar' }).click()
    }
    await page.getByRole('link', {name: 'Users'}).click()
    await expect(page).toHaveURL('/admin/users')
    await expect(page.getByText('Manage users and reset passwords')).toBeVisible()
})

test('Admin can reset password', async ({ page, browser }) => {
    // userContext and all pages inside, including userPage, are signed in as "user".
    const userContext = await browser.newContext({ storageState: { cookies: [], origins: []} });
    const userPage = await userContext.newPage();
    const authPage = new AuthPage(userPage)
    const name = `${generateRandomString(4, false)}@user.com`
    const password = generateRandomString()
    await authPage.goToSignUpPage()
    await takeScreenshot(userPage, 'sign-up')
    await authPage.signUp(name, password, 'Forgetful Sam')

    // adminContext and all pages inside, including adminPage, are signed in as "admin".
    const adminContext = await browser.newContext({ storageState: 'playwright/.auth/admin.json' });
    const adminPage = await adminContext.newPage();

    await adminPage.goto('/admin/users')
    await takeScreenshot(adminPage, 'user-list')
    await adminPage.getByRole('row').filter({ hasText: name }).getByRole('button', { name: 'Reset password'}).click()
    await adminPage.getByRole('textbox').fill('new-password')
    await takeScreenshot(adminPage, 'reset-password')
    await adminPage.getByRole('button', { name: 'Reset password'}).click()
    await expect(adminPage.getByText('Password reset successful')).toBeVisible()

    await authPage.logOut()
    await authPage.logIn(name, 'new-password')

    await expect(userPage).toHaveURL('/account/change-password')
    await takeScreenshot(adminPage, 'change-password')
    await authPage.changePassword('new-password', 'new-password-2')

    await userPage.getByText('Forgetful Sam')

})