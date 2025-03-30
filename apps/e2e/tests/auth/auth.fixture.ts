
import { test as base } from '@playwright/test';
import { SignupPage, LoginPage } from "page-objects";


export const test = base.extend<{ signupPage: SignupPage, loginPage: LoginPage }>({
    signupPage: async ({ page }, use) => {
        const authPage = new SignupPage(page);
        await use(authPage);
    },
    loginPage: async ({ page }, use) => {
        const authPage = new LoginPage(page);
        await use(authPage);
    }
})

export const expect = base.expect;