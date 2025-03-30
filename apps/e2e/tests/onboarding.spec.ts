import { test, expect } from "./fixtures";

test.describe('Onboarding Flow', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('User can complete the full onboarding process', async ({ page, onboardingPage }) => {
    // Navigate to onboarding
    await onboardingPage.goto();

    // Verify welcome screen is displayed
    await expect(onboardingPage.welcomeHeading).toBeVisible();

    // Start the onboarding process
    await onboardingPage.startOnboarding();

    // Create an apiary
    await onboardingPage.createApiary({
      name: 'Test Apiary',
      location: 'Test Location',
      setMapLocation: true
    });

    // Create a hive
    await onboardingPage.createHive({
      name: 'Test Hive',
      notes: 'Test hive notes'
    });

    // Verify onboarding is complete
    await expect(onboardingPage.congratulationsHeading).toBeVisible();

    // Finish onboarding
    await onboardingPage.finishOnboarding();

    // Verify we're redirected to the dashboard
    await expect(page).toHaveURL('/');
  });

  test('User can complete onboarding with minimal information', async ({ page, onboardingPage }) => {
    await onboardingPage.goto();
    await onboardingPage.completeOnboarding({
      apiaryName: 'Minimal Apiary',
      hiveName: 'Minimal Hive'
    });
    await expect(page).toHaveURL('/');
  });
});