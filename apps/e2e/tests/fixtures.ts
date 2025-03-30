import { test as base } from '@playwright/test'
import {LoginPage, SignupPage, OnboardingWizardPage} from "page-objects";

export const test = base.extend<{
    signupPage: SignupPage,
    loginPage: LoginPage,
    onboardingPage: OnboardingWizardPage
}>({
    signupPage: async ({ page }, use) => {
        const authPage = new SignupPage(page);
        await use(authPage);
    },
    loginPage: async ({ page }, use) => {
        const authPage = new LoginPage(page);
        await use(authPage);
    },
    onboardingPage: async ({ page }, use) => {
        const wizardPage = new OnboardingWizardPage(page);
        await use(wizardPage);
    }
})

export const expect = base.expect;