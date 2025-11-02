import { Locator, Page } from "@playwright/test";

export class LoginPage {
    readonly page: Page;
    readonly emailField: Locator;
    readonly passwordField: Locator;
    readonly confirmPasswordField: Locator;
    readonly loginButton: Locator;
    readonly currentPassword: Locator;
    readonly newPassword: Locator;
    readonly confirmNewPassword: Locator;
    readonly changePasswordButton: Locator;
    readonly registerLink: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailField = page.getByLabel('email');
        this.passwordField = page.getByRole('textbox', { name: 'Password', exact: true });
        this.loginButton = page.getByRole('button', { name: /sign in/i });
        this.confirmPasswordField = page.getByRole('textbox', { name: 'Confirm Password' });
        this.currentPassword = page.getByRole('textbox', { name: 'Current Password' });
        this.newPassword = page.getByRole('textbox', { name: 'New Password', exact: true });
        this.confirmNewPassword = page.getByRole('textbox', { name: 'Confirm New Password' });
        this.changePasswordButton = page.getByRole('button', { name: 'Change Password' });
        this.registerLink = page.getByRole('link', { name: 'Sign Up' });
    }

    async goToLogInPage() {
        await this.page.goto('/login');
    }

    async logIn(email: string, password: string) {
        await this.page.goto('/login');
        await this.emailField.fill(email);
        await this.passwordField.fill(password);
        await this.loginButton.click();
    }

    async changePassword(oldPassword: string, newPassword: string) {
        await this.currentPassword.fill(oldPassword);
        await this.newPassword.fill(newPassword);
        await this.confirmNewPassword.fill(newPassword);
        await this.changePasswordButton.click();
    }
}
