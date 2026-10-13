import { test, expect } from '@playwright/test';
import type { Stateful } from './temperature-input-field.story.tsx';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';

test.describe('TemperatureField', () => {
  test('renders with default values', async ({ mount }) => {
    const component = await mount(
      'components/common/temperature-input-field/Default',
    );

    // Check if the component renders properly
    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '20',
    );
    await expect(component).toContainText('°C');
  });

  test('renders thermometer icon', async ({ mount, page }) => {
    await mount('components/common/temperature-input-field/Default');

    await expect(page.getByTestId('input-icon')).toBeVisible();
  });

  test('handles increment and decrement buttons', async ({ mount }) => {
    const component = await mount<typeof Stateful>(
      'components/common/temperature-input-field/Stateful',
      { initialValue: 20, min: -10, max: 40 },
    );

    // Initial value check
    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '20',
    );

    // Click increment button
    await component
      .getByTestId(TEST_SELECTORS.NUMERIC_FIELD_INCREMENT_BUTTON)
      .click();

    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '21',
    );
    await expect(component.getByTestId('field-value')).toHaveValue('21');

    // Click decrement button
    await component
      .getByTestId(TEST_SELECTORS.NUMERIC_FIELD_DECREMENT_BUTTON)
      .click();

    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '20',
    );
  });

  test('respects min and max temperature values', async ({ mount }) => {
    const component = await mount<typeof Stateful>(
      'components/common/temperature-input-field/Stateful',
      { initialValue: 38, min: -10, max: 40 },
    );

    // Initial value check
    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '38',
    );

    // Try to exceed max value
    await component
      .getByTestId(TEST_SELECTORS.NUMERIC_FIELD_INCREMENT_BUTTON)
      .click();

    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '39',
    );

    await component
      .getByTestId(TEST_SELECTORS.NUMERIC_FIELD_INCREMENT_BUTTON)
      .click();

    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '40',
    );

    // Try to exceed max value again (should stay at max)
    await component
      .getByTestId(TEST_SELECTORS.NUMERIC_FIELD_INCREMENT_BUTTON)
      .click();

    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '40',
    );
  });

  test('shows slider when focused', async ({ mount }) => {
    const component = await mount(
      'components/common/temperature-input-field/Default',
    );

    // Slider should not be initially visible
    const sliderBefore = component.locator('numeric-slider');
    await expect(sliderBefore).toHaveCount(0);

    // Focus the input to show the slider
    await component.locator('input[data-slot="input"]').focus();

    // Now the slider should be visible
    const sliderAfter = component.getByTestId('numeric-slider');
    await expect(sliderAfter).toBeVisible();
  });
});
