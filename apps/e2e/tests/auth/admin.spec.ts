import {createScreenshotHelper} from "../screenshot-helper";
import { test , expect} from './auth.fixture'
import {generateRandomString} from "../utils";
import {LoginPage, SignupPage} from "page-objects";

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
test('Admin can view users', async ({ page, isMobile }) => {

    page.goto('/')
    await takeScreenshot(page, 'users')
    console.log('isMobile', isMobile)
    if (isMobile) {
        await page.getByRole('button', { name: 'Toggle Sidebar' }).click()
    }
    await page.getByRole('link', {name: 'Users'}).click()
    await expect(page).toHaveURL('/admin/users')
    await expect(page.getByText('Create accounts, find users and manage their access')).toBeVisible()
})

test('Admin can reset password', async ({ page, browser }) => {
    // userContext and all pages inside, including userPage, are signed in as "user".
    const userContext = await browser.newContext({ storageState: { cookies: [], origins: []} });
    const userPage = await userContext.newPage();
    const signupPage = new SignupPage(userPage)
    const name = `${generateRandomString(4, false)}@user.com`
    const password = generateRandomString()
    await signupPage.goToSignUpPage()
    await takeScreenshot(userPage, 'sign-up')
    await signupPage.signUp(name, password, 'Forgetful Sam')

    // adminContext and all pages inside, including adminPage, are signed in as "admin".
    const adminContext = await browser.newContext({ storageState: 'playwright/.auth/admin.json' });
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`/admin/users?q=${encodeURIComponent(name)}`)
    await takeScreenshot(adminPage, 'user-list')
    await adminPage.getByRole('button', { name: `Actions for ${name}` }).click()
    await adminPage.getByRole('menuitem', { name: 'Reset password' }).click()
    await adminPage.getByLabel('Temporary password').fill('new-password')
    await takeScreenshot(adminPage, 'reset-password')
    await adminPage.getByRole('dialog').getByRole('button', { name: 'Reset password'}).click()
    await expect(adminPage.getByText('Password reset successful')).toBeVisible()

    await signupPage.logOut()
    const loginPage = new LoginPage(userPage)
    await loginPage.logIn(name, 'new-password')

    await expect(userPage).toHaveURL('/account/change-password')
    await takeScreenshot(adminPage, 'change-password')
    await loginPage.changePassword('new-password', 'new-password-2')

    await userPage.getByText('Forgetful Sam')

})

test('Admin can create a user with a temporary password', async ({ browser }) => {
    const adminContext = await browser.newContext({ storageState: 'playwright/.auth/admin.json' });
    const adminPage = await adminContext.newPage();
    const email = `${generateRandomString(6, false)}@created.com`

    await adminPage.goto('/admin/users')
    await adminPage.getByRole('button', { name: 'Create user' }).click()
    const dialog = adminPage.getByRole('dialog')
    await dialog.getByLabel('Name').fill('Created Carla')
    await dialog.getByLabel('Email').fill(email)
    await dialog.getByLabel('Temporary password').fill('temp-password-1')
    await takeScreenshot(adminPage, 'create-user')
    await dialog.getByRole('button', { name: 'Create user' }).click()
    await expect(dialog.getByText('temp-password-1')).toBeVisible()
    await dialog.getByRole('button', { name: 'Close' }).first().click()

    await adminPage.goto(`/admin/users?q=${encodeURIComponent(email)}`)
    await expect(adminPage.getByText('Must change password')).toBeVisible()

    const userContext = await browser.newContext({ storageState: { cookies: [], origins: []} });
    const loginPage = new LoginPage(await userContext.newPage())
    await loginPage.logIn(email, 'temp-password-1')
    await expect(loginPage.page).toHaveURL('/account/change-password')
    await loginPage.changePassword('temp-password-1', 'my-own-password')
    // Changing the password signs out; admin-created accounts never saw the
    // signup form's privacy checkbox, so the next sign-in asks for consent.
    await expect(loginPage.page).toHaveURL('/login')
    await loginPage.logIn(email, 'my-own-password')
    await expect(loginPage.page).toHaveURL('/account/consent')
})
