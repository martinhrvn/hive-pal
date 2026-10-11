import {
  ApiaryFormPage,
  ApiarySwitcher,
  HiveDetailPage,
  HiveFormPage,
  InspectionFormPage,
  LoginPage,
  NavUser,
  OnboardingWizardPage,
  SignupPage,
} from 'page-objects';
import {
  apiFromContext,
  expect,
  smokeEmail,
  smokePassword,
  test,
  uniqueName,
} from './fixtures';

/**
 * Golden path through the app, in one serial test:
 * sign up → onboarding wizard → first inspection → second apiary →
 * second hive → apiary switcher → log out → log in.
 *
 * Signs up through the UI (unlike the per-page specs) because the register
 * form is part of what we smoke-test.
 */
test.describe('Journey', { tag: ['@journey'] }, () => {
  test('new user can set up two apiaries with hives and record an inspection', async ({
    page,
    context,
    baseURL,
  }, testInfo) => {
    test.setTimeout(180_000);

    const email = smokeEmail(testInfo);
    const password = smokePassword();
    const apiaryOne = uniqueName('Journey Apiary');
    const apiaryTwo = uniqueName('Second Apiary');
    const hiveOne = uniqueName('Hive Anna');
    const hiveTwo = uniqueName('Hive Boris');

    const signup = new SignupPage(page);
    const wizard = new OnboardingWizardPage(page);
    const apiaryForm = new ApiaryFormPage(page);
    const hiveForm = new HiveFormPage(page);
    const hiveDetail = new HiveDetailPage(page);
    const inspectionForm = new InspectionFormPage(page);
    const switcher = new ApiarySwitcher(page);
    const navUser = new NavUser(page);

    await test.step('sign up through the register page', async () => {
      await signup.goToSignUpPage();
      await signup.signUp(email, password, 'Journey Tester');
      // Registration reloads the page via window.location; wait for the URL, not the DOM.
      await page.waitForURL(url => !url.pathname.startsWith('/register'), {
        timeout: 20_000,
      });
    });

    await test.step('remove the auto-created apiary so the wizard starts at the welcome step', async () => {
      const api = await apiFromContext(context, baseURL!);
      for (const apiary of await api.listApiaries()) {
        await api.deleteApiary(apiary.id);
      }
      await api.dispose();
    });

    await test.step('complete the onboarding wizard', async () => {
      await wizard.goto();
      await expect(wizard.startButton).toBeVisible();
      await wizard.startOnboarding();

      await apiaryForm.fillApiaryForm({
        name: apiaryOne,
        location: 'Smoke Meadow',
      });
      await apiaryForm.submitForm();

      await expect(wizard.hiveStepHeading).toBeVisible();
      await hiveForm.fillHiveForm({
        name: hiveOne,
        notes: 'First hive from the smoke test',
      });
      await hiveForm.submitForm();

      // The wizard redirects to "/" as soon as the user has an apiary and a
      // hive, which can pre-empt the "Congratulations!" step. Accept either.
      await expect
        .poll(
          async () =>
            (await wizard.congratulationsHeading.isVisible()) ||
            new URL(page.url()).pathname === '/',
          { timeout: 15_000 },
        )
        .toBe(true);
      if (await wizard.congratulationsHeading.isVisible()) {
        await wizard.finishOnboarding();
      }
      await expect(page).toHaveURL(/\/$/);
    });

    await test.step('dashboard shows the new hive and opens its detail page', async () => {
      await expect(switcher.trigger).toContainText(apiaryOne);
      await page.getByText(hiveOne).first().click();
      await expect(page).toHaveURL(/\/hives\/[0-9a-f-]+$/);
      await expect(hiveDetail.heading(hiveOne)).toBeVisible();
    });

    await test.step('record an inspection from the hive page', async () => {
      await hiveDetail.addInspectionButton.click();
      await expect(page).toHaveURL(/\/inspections\/create/);
      await inspectionForm.fillNotes('Colony calm, brood in all stages.');
      await inspectionForm.save();
      await expect(page).toHaveURL(/\/inspections\/[0-9a-f-]+$/);
      await expect(
        page.getByText('Colony calm, brood in all stages.'),
      ).toBeVisible();
    });

    await test.step('create a second apiary and make it active', async () => {
      await page.goto('/apiaries/create');
      await apiaryForm.fillApiaryForm({ name: apiaryTwo });
      await apiaryForm.submitForm();
      await expect(page).toHaveURL(/\/$/);
      await switcher.select(apiaryTwo);
      await switcher.expectActive(apiaryTwo);
    });

    await test.step('add a hive to the second apiary', async () => {
      await page.goto('/hives/create');
      await hiveForm.fillHiveForm({ name: hiveTwo });
      await hiveForm.submitForm();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByText(hiveTwo).first()).toBeVisible();
    });

    await test.step('the switcher lists both apiaries and filters the hive list', async () => {
      await switcher.expectItems([apiaryOne, apiaryTwo]);

      await page.goto('/hives');
      await expect(page.getByText(hiveTwo).first()).toBeVisible();
      await expect(page.getByText(hiveOne)).toHaveCount(0);

      await switcher.selectAll();
      await expect(page.getByText(hiveOne).first()).toBeVisible();
      await expect(page.getByText(hiveTwo).first()).toBeVisible();
    });

    await test.step('log out and log back in', async () => {
      await navUser.logout();
      const login = new LoginPage(page);
      await login.logIn(email, password);
      await expect(switcher.trigger).toBeVisible({ timeout: 20_000 });
    });
  });
});
