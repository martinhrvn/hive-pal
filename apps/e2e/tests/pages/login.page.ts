import {Locator, Page} from "@playwright/test";

export class LoginPage {
    readonly page: Page;
    readonly loginField: Locator
    readonly passwordField: Locator
    readonly submitButton: Locator
    readonly username: string
    readonly password: string

    constructor(page: Page) {
        this.page = page;
        this.loginField = page.getByLabel('email');
        this.passwordField = page.getByLabel('password');
        this.submitButton = page.getByRole('button', { name: /sign in/i });
    }
}