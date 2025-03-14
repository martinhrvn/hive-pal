
import { test as base } from '@playwright/test';
import {AuthPage} from "./auth.page";


export const test = base.extend<{ authPage: AuthPage }>({
    authPage: async ({ page }, use) => {
        const authPage = new AuthPage(page);
        await use(authPage);
    },
})

export const expect = base.expect;