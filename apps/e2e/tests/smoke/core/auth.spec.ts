import { ForgotPasswordPage, LoginPage, SignupPage } from 'page-objects';
import { expect, smokeEmail, smokePassword, test } from '../fixtures';

/**
 * Logged-out auth flows. No `freshUser` fixture: nothing here needs a session.
 *
 * `retries: 0` because the password-reset endpoint is rate limited to
 * 3 requests / 60 s per IP in production mode; a retry would hit the limit.
 */
test.describe('Auth', { tag: ['@core'] }, () => {
  test.describe.configure({ retries: 0 });

  test('register without privacy consent shows a validation error', async ({
    page,
  }, testInfo) => {
    const signup = new SignupPage(page);
    const password = smokePassword();

    await signup.goToSignUpPage();
    await signup.emailField.fill(smokeEmail(testInfo, 'noconsent'));
    await signup.passwordField.fill(password);
    await signup.confirmPasswordField.fill(password);
    await signup.displayNameField.fill('No Consent');
    await signup.signUpButton.click();

    await expect(
      page.getByText('Privacy policy consent is required'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });

  test('login with a wrong password shows an error', async ({
    page,
  }, testInfo) => {
    const login = new LoginPage(page);

    await login.logIn(
      smokeEmail(testInfo, 'nouser'),
      'definitely-wrong-password',
    );

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('forgot password confirms that a reset link was sent', async ({
    page,
  }, testInfo) => {
    const forgot = new ForgotPasswordPage(page);

    await forgot.goto();
    await forgot.requestReset(smokeEmail(testInfo, 'reset'));

    await expect(forgot.sentHeading).toBeVisible({ timeout: 15_000 });
  });
});
