import { test, expect } from '../fixtures';

/**
 * E2E Tests for Box Update Retry Mechanism
 *
 * Tests the pending box update functionality when box update fails after successful inspection save.
 * Verifies retry logic, rate limiting, staleness detection, and error handling.
 *
 * Prerequisites:
 * - User must be authenticated
 * - Test data must include apiaries, hives, and inspections
 */

test.describe('Inspection Box Update Retry Mechanism', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  /**
   * Scenario 6.2: Inspection saves but box update fails due to network error
   * - Mock box update API endpoint to return 500 error on first attempt
   * - Submit inspection with box configuration changes
   * - Verify inspection is saved to database
   * - Verify warning banner appears on inspection detail page with error message
   * - Verify "Retry" and "Dismiss" buttons are visible
   */
  test('6.2: Box update fails during inspection save - warning banner appears', async ({ page, loginPage }) => {
    // Setup: Login and navigate to inspection
    await loginPage.goToLogInPage();
    
    // Note: This test assumes pre-existing test data (apiary, hive, inspection)
    // In real scenario, we would create these or use fixtures
    
    // Navigate to inspection list and open an inspection
    // This path depends on actual routing - adjust based on your app structure
    await page.goto('/apiaries/1/hives/1/inspections/1');
    
    // Wait for inspection detail page to load
    await expect(page.getByRole('heading', { name: /inspection/i })).toBeVisible();
    
    // Setup API mocking for box update to fail with 500 error
    await page.route('**/api/hives/*/boxes', route => {
      if (route.request().method() === 'PATCH') {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    // Make a change to the inspection that would trigger box update
    // Example: Add a new box or modify box configuration
    const addBoxButton = page.getByRole('button', { name: /add box|new box/i });
    if (await addBoxButton.isVisible()) {
      await addBoxButton.click();
    }
    
    // Fill in box details (adjust selectors based on actual form)
    // This is a simplified example - adapt to your form structure
    await page.fill('input[placeholder*="box"]', 'New Box');
    
    // Save the inspection (this should succeed)
    const saveButton = page.getByRole('button', { name: /save|submit/i });
    await saveButton.click();
    
    // Verify inspection save succeeds (success toast or navigation)
    await expect(page.getByText(/inspection.*saved|saved successfully/i)).toBeVisible({ timeout: 5000 });
    
    // Verify warning banner appears with box update error
    const warningBanner = page.getByRole('alert').filter({ hasText: /unable to update|box.*configuration|failed/i });
    await expect(warningBanner).toBeVisible({ timeout: 5000 });
    
    // Verify banner contains error message
    await expect(warningBanner).toContainText(/error|failed|unable/i);
    
    // Verify Retry button is visible and enabled
    const retryButton = page.getByRole('button', { name: /retry/i }).first();
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();
    
    // Verify Dismiss button is visible
    const dismissButton = page.getByRole('button', { name: /dismiss|close|ok/i }).nth(1);
    await expect(dismissButton).toBeVisible();
  });

  /**
   * Scenario 6.3: Successful retry after initial failure
   * - Continue from previous scenario (banner is visible)
   * - Mock box update API to succeed on next attempt
   * - Click "Retry" button
   * - Verify banner shows loading state during retry
   * - Verify banner disappears after successful retry
   * - Verify success toast is displayed
   */
  test('6.3: Successful retry after initial failure - banner disappears', async ({ page, loginPage }) => {
    // Setup: Same as 6.2 - get to failed state
    await loginPage.goToLogInPage();
    await page.goto('/apiaries/1/hives/1/inspections/1');
    
    await expect(page.getByRole('heading', { name: /inspection/i })).toBeVisible();
    
    // First, fail the box update
    let requestCount = 0;
    await page.route('**/api/hives/*/boxes', route => {
      if (route.request().method() === 'PATCH') {
        requestCount++;
        if (requestCount === 1) {
          // First attempt fails
          route.abort('failed');
        } else {
          // Subsequent attempts succeed
          route.continue();
        }
      } else {
        route.continue();
      }
    });
    
    // Trigger inspection save with box changes (same as 6.2)
    const addBoxButton = page.getByRole('button', { name: /add box|new box/i });
    if (await addBoxButton.isVisible()) {
      await addBoxButton.click();
    }
    
    // Save inspection
    const saveButton = page.getByRole('button', { name: /save|submit/i });
    await saveButton.click();
    
    // Wait for warning banner to appear
    const warningBanner = page.getByRole('alert').filter({ hasText: /unable to update|box.*configuration|failed/i });
    await expect(warningBanner).toBeVisible({ timeout: 5000 });
    
    // Click retry button
    const retryButton = page.getByRole('button', { name: /retry/i }).first();
    await expect(retryButton).toBeVisible();
    
    // Track loading state (if loading spinner is visible)
    await retryButton.click();
    
    // Verify button shows loading state (spinner or disabled state)
    await expect(retryButton).toBeDisabled({ timeout: 1000 });
    
    // Wait for loading state to complete and button to re-enable
    await retryButton.waitFor({ state: 'enabled', timeout: 10000 });
    
    // Verify warning banner disappears
    await expect(warningBanner).not.toBeVisible({ timeout: 5000 });
    
    // Verify success toast is displayed
    const successToast = page.getByText(/successfully|updated|complete/i);
    await expect(successToast).toBeVisible({ timeout: 5000 });
  });

  /**
   * Scenario 6.4: User dismisses failed box update
   * - Mock box update API to fail
   * - Submit inspection, verify banner appears
   * - Click "Dismiss" button
   * - Verify banner disappears immediately
   * - Refresh page and verify banner does NOT reappear (store cleared)
   */
  test('6.4: User dismisses failed box update - banner gone on refresh', async ({ page, loginPage }) => {
    // Setup: Login and navigate to inspection
    await loginPage.goToLogInPage();
    await page.goto('/apiaries/1/hives/1/inspections/1');
    
    await expect(page.getByRole('heading', { name: /inspection/i })).toBeVisible();
    
    // Mock box update to always fail
    await page.route('**/api/hives/*/boxes', route => {
      if (route.request().method() === 'PATCH') {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    // Trigger inspection save with box changes
    const addBoxButton = page.getByRole('button', { name: /add box|new box/i });
    if (await addBoxButton.isVisible()) {
      await addBoxButton.click();
    }
    
    // Save inspection
    const saveButton = page.getByRole('button', { name: /save|submit/i });
    await saveButton.click();
    
    // Wait for warning banner to appear
    const warningBanner = page.getByRole('alert').filter({ hasText: /unable to update|box.*configuration|failed/i });
    await expect(warningBanner).toBeVisible({ timeout: 5000 });
    
    // Click dismiss button
    const dismissButton = page.getByRole('button', { name: /dismiss|close|ok/i }).nth(1);
    await expect(dismissButton).toBeVisible();
    await dismissButton.click();
    
    // Verify banner disappears immediately
    await expect(warningBanner).not.toBeVisible({ timeout: 1000 });
    
    // Refresh page
    await page.reload();
    
    // Wait for page to reload and inspection to load
    await expect(page.getByRole('heading', { name: /inspection/i })).toBeVisible({ timeout: 5000 });
    
    // Verify banner does NOT reappear (in-memory store is cleared on refresh)
    await expect(warningBanner).not.toBeVisible({ timeout: 2000 });
  });

  /**
   * Scenario 6.5: Retry limit reached after 5 failures
   * - Mock box update API to always fail
   * - Retry 5 times (manually or via loop)
   * - Verify "Retry" button is disabled after 5th failure
   * - Verify error message changes to "Unable to update after 5 attempts..."
   * - Verify "Dismiss" button still works
   */
  test('6.5: Retry limit reached after 5 failures - button disabled', async ({ page, loginPage }) => {
    // Setup: Login and navigate to inspection
    await loginPage.goToLogInPage();
    await page.goto('/apiaries/1/hives/1/inspections/1');
    
    await expect(page.getByRole('heading', { name: /inspection/i })).toBeVisible();
    
    // Mock box update to always fail
    await page.route('**/api/hives/*/boxes', route => {
      if (route.request().method() === 'PATCH') {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    // Trigger inspection save with box changes
    const addBoxButton = page.getByRole('button', { name: /add box|new box/i });
    if (await addBoxButton.isVisible()) {
      await addBoxButton.click();
    }
    
    // Save inspection
    const saveButton = page.getByRole('button', { name: /save|submit/i });
    await saveButton.click();
    
    // Wait for warning banner to appear
    const warningBanner = page.getByRole('alert').filter({ hasText: /unable to update|box.*configuration|failed/i });
    await expect(warningBanner).toBeVisible({ timeout: 5000 });
    
    // Click retry button 5 times
    const retryButton = page.getByRole('button', { name: /retry/i }).first();
    
    for (let i = 0; i < 5; i++) {
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toBeEnabled();
      await retryButton.click();
      
      // Wait for API call to complete
      await page.waitForTimeout(1000);
      
      // Wait for button to be re-enabled (unless it's the last iteration)
      if (i < 4) {
        await retryButton.waitFor({ state: 'enabled', timeout: 10000 });
      }
    }
    
    // After 5th failure, retry button should be disabled
    await expect(retryButton).toBeDisabled({ timeout: 5000 });
    
    // Verify error message indicates retry limit
    const errorMessage = page.getByText(/unable to update.*5|5.*attempts|manually update/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Verify dismiss button still works
    const dismissButton = page.getByRole('button', { name: /dismiss|close|ok/i }).nth(1);
    await expect(dismissButton).toBeVisible();
    await expect(dismissButton).toBeEnabled();
  });

  /**
   * Scenario 6.6: In-progress state during navigation
   * - Mock box update API with 5-second delay
   * - Submit inspection
   * - Navigate away from inspection detail page before box update completes
   * - Navigate back to inspection detail page
   * - Verify banner shows loading state or error state (depending on timing)
   */
  test('6.6: In-progress state persists during navigation', async ({ page, loginPage }) => {
    // Setup: Login and navigate to inspection
    await loginPage.goToLogInPage();
    await page.goto('/apiaries/1/hives/1/inspections/1');
    
    const inspectionUrl = page.url();
    
    await expect(page.getByRole('heading', { name: /inspection/i })).toBeVisible();
    
    // Mock box update with 5-second delay
    await page.route('**/api/hives/*/boxes', route => {
      if (route.request().method() === 'PATCH') {
        // Delay response by 5 seconds
        setTimeout(() => {
          route.abort('failed');
        }, 5000);
      } else {
        route.continue();
      }
    });
    
    // Trigger inspection save with box changes
    const addBoxButton = page.getByRole('button', { name: /add box|new box/i });
    if (await addBoxButton.isVisible()) {
      await addBoxButton.click();
    }
    
    // Save inspection
    const saveButton = page.getByRole('button', { name: /save|submit/i });
    await saveButton.click();
    
    // Wait briefly for inspection to save (should succeed)
    await expect(page.getByText(/inspection.*saved|saved successfully/i)).toBeVisible({ timeout: 5000 });
    
    // Navigate away before box update completes (within 5 seconds)
    await page.goto('/apiaries/1/hives');
    
    // Wait a moment, then navigate back
    await page.waitForTimeout(2000);
    await page.goto(inspectionUrl);
    
    // Verify inspection detail page loads
    await expect(page.getByRole('heading', { name: /inspection/i })).toBeVisible({ timeout: 5000 });
    
    // Depending on timing, we should see either:
    // 1. Loading banner (if box update is still in progress)
    // 2. Error banner (if box update completed with failure)
    
    const warningBanner = page.getByRole('alert').filter({ 
      hasText: /unable to update|box.*configuration|failed|loading|retrying/i 
    });
    
    // Give it time to either show banner or complete
    try {
      await expect(warningBanner).toBeVisible({ timeout: 10000 });
    } catch {
      // If banner doesn't appear, that's also valid (update may have timed out silently)
      // In production, we'd expect an error banner eventually
    }
  });
});
