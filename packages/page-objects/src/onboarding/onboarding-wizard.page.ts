import { Locator, Page } from '@playwright/test';
import { ApiaryFormPage } from '../apiary';
import { HiveFormPage } from '../hive';

export class OnboardingWizardPage {
  private readonly page: Page;
  readonly apiaryForm: ApiaryFormPage;
  readonly hiveForm: HiveFormPage;

  readonly welcomeHeading: Locator;
  readonly startButton: Locator;
  readonly finishButton: Locator;
  readonly stepIndicator: Locator;
  readonly successIcon: Locator;
  readonly congratulationsHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.apiaryForm = new ApiaryFormPage(page);
    this.hiveForm = new HiveFormPage(page);

    this.welcomeHeading = page.getByText('Welcome to Hive-Pal!');
    this.startButton = page.getByRole('button', { name: "Let's Get Started" });
    this.finishButton = page.getByRole('button', { name: 'Go to Dashboard' });
    this.stepIndicator = page.locator('.stepper');
    this.successIcon = page.locator('.CheckIcon');
    this.congratulationsHeading = page.getByRole('heading', { name: 'Congratulations!' });
  }

  /**
   * Navigate to the onboarding page
   */
  async goto() {
    await this.page.goto('/onboarding');
  }

  /**
   * Wait for the page to load and welcome screen to be visible
   */
  async waitForPage() {
    await this.welcomeHeading.waitFor({ state: 'visible' });
  }

  /**
   * Start the onboarding process
   */
  async startOnboarding() {
    await this.startButton.click();
  }

  /**
   * Complete the apiary creation step
   */
  async createApiary({
    name,
    location,
    setMapLocation = false,
  }: {
    name: string;
    location?: string;
    setMapLocation?: boolean;
  }) {
    // Fill and submit the apiary form
    await this.apiaryForm.fillApiaryForm({ name, location, setMapLocation });
    await this.apiaryForm.submitForm();
  }

  /**
   * Complete the hive creation step
   */
  async createHive({
    name,
    notes,
    installationDate,
  }: {
    name: string;
    notes?: string;
    installationDate?: Date;
  }) {
    // Fill and submit the hive form
    await this.hiveForm.fillHiveForm({ name, notes, installationDate });
    await this.hiveForm.submitForm();
  }

  /**
   * Finish the onboarding process
   */
  async finishOnboarding() {
    await this.finishButton.click();
  }

  /**
   * Verify that onboarding is complete (congratulations screen is shown)
   */
  async verifyOnboardingComplete() {
    await this.congratulationsHeading.waitFor({ state: 'visible' });
    return this.congratulationsHeading.isVisible();
  }

  /**
   * Complete the entire onboarding process
   */
  async completeOnboarding({
    apiaryName,
    apiaryLocation,
    hiveName,
    hiveNotes,
  }: {
    apiaryName: string;
    apiaryLocation?: string;
    hiveName: string;
    hiveNotes?: string;
  }) {
    await this.waitForPage();
    await this.startOnboarding();
    await this.createApiary({ name: apiaryName, location: apiaryLocation });
    await this.createHive({ name: hiveName, notes: hiveNotes });
    await this.verifyOnboardingComplete();
    await this.finishOnboarding();
  }
}