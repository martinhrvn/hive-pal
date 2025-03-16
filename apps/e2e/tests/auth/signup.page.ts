import {Locator, Page} from "@playwright/test";

export class SignupPage {
    readonly page: Page;
    readonly emailField: Locator
    readonly passwordField: Locator
    readonly confirmPasswordField: Locator
    readonly displayNameField: Locator
    readonly signUpButton: Locator
    readonly logOutButton: Locator

    constructor(page: Page) {
        this.page = page;
        this.emailField = page.getByLabel('email');
        this.passwordField = page.getByRole('textbox', { name: 'Password', exact: true })
        this.confirmPasswordField = page.getByRole('textbox', { name: 'Confirm Password' });
        this.displayNameField = page.getByRole('textbox', { name: 'Display Name' });
        this.signUpButton = page.getByRole('button', { name: 'Register' });
        this.logOutButton = page.getByRole('button', { name: 'Logout' });
    }

    async goToSignUpPage() {
        await this.page.goto('/register')
    }

    async signUp(email: string, password: string, displayName: string) {

        await this.emailField.fill(email)
        await this.passwordField.fill(password)
        await this.confirmPasswordField.fill(password)
        await this.displayNameField.fill(displayName)
        await this.signUpButton.click()
    }

    async logOut() {
        await this.logOutButton.click()
    }
}