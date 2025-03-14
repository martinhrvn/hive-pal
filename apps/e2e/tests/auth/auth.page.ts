import {Locator, Page} from "@playwright/test";

export class AuthPage {
    readonly page: Page;
    readonly emailField: Locator
    readonly passwordField: Locator
    readonly confirmPasswordField: Locator
    readonly displayNameField: Locator
    readonly loginButton: Locator
    readonly signUpButton: Locator
    readonly logOutButton: Locator
    readonly currentPassword: Locator
    readonly newPassword: Locator
    readonly confirmNewPassword: Locator
    readonly changePasswordButton: Locator

    constructor(page: Page) {
        this.page = page;
        this.emailField = page.getByLabel('email');
        this.passwordField = page.getByRole('textbox', { name: 'Password', exact: true })
        this.loginButton = page.getByRole('button', { name: /sign in/i });
        this.confirmPasswordField = page.getByRole('textbox', { name: 'Confirm Password' });
        this.displayNameField = page.getByRole('textbox', { name: 'Display Name' });
        this.signUpButton = page.getByRole('button', { name: 'Register' });
        this.logOutButton = page.getByRole('button', { name: 'Logout' });
        this.currentPassword = page.getByRole('textbox', { name: 'Current Password' });
        this.newPassword = page.getByRole('textbox', { name: 'New Password' , exact: true});
        this.confirmNewPassword = page.getByRole('textbox', { name: 'Confirm New Password' });
        this.changePasswordButton = page.getByRole('button', { name: 'Change Password' });
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

    async logIn(email: string, password: string) {
        await this.page.goto('/login')
        await this.emailField.fill(email)
        await this.passwordField.fill(password)
        await this.loginButton.click()
    }

    async changePassword(oldPassword: string, newPassword: string) {
        await this.currentPassword.fill(oldPassword)
        await this.newPassword.fill(newPassword)
        await this.confirmNewPassword.fill(newPassword)
        await this.changePasswordButton.click()
    }

    async logOut() {
        await this.logOutButton.click()
    }
}