import { test, expect } from '@playwright/test';
import type { Stateful } from './numeric-input-field.story.tsx';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';

test.describe('NumericField', () => {
  test('renders with default values', async ({ mount }) => {
    const component = await mount(
      'components/common/numeric-input-field/Default',
    );

    // Check if the component renders properly
    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '20',
    );
    await expect(component).toContainText('°C');
  });

  test('renders with renderIcon prop', async ({ mount, page }) => {
    await mount(
      'components/common/numeric-input-field/NumericInputFieldWithIcon',
    );

    // Check if icon renders
    await expect(page.getByTestId('input-icon')).toBeVisible();
  });

  test('handles increment and decrement buttons', async ({ mount }) => {
    const component = await mount<typeof Stateful>(
      'components/common/numeric-input-field/Stateful',
      { initialValue: 5, min: 0, max: 10, defaultValue: 5, unit: 'items' },
    );

    // Initial value check
    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '5',
    );

    // Click increment button
    await component
      .getByTestId(TEST_SELECTORS.NUMERIC_FIELD_INCREMENT_BUTTON)
      .click();

    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '6',
    );
    await expect(component.getByTestId('field-value')).toHaveValue('6');

    // Click increment button again
    await component
      .getByTestId(TEST_SELECTORS.NUMERIC_FIELD_INCREMENT_BUTTON)
      .first()
      .click();

    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '7',
    );

    // Click decrement button
    await component
      .getByTestId(TEST_SELECTORS.NUMERIC_FIELD_DECREMENT_BUTTON)
      .click();

    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '6',
    );
  });

  test('respects min and max values', async ({ mount }) => {
    const component = await mount<typeof Stateful>(
      'components/common/numeric-input-field/Stateful',
      { initialValue: 9, min: 0, max: 10, defaultValue: 5, unit: 'items' },
    );

    // Initial value check
    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '9',
    );

    // Try to exceed max value
    await component
      .getByTestId(TEST_SELECTORS.NUMERIC_FIELD_INCREMENT_BUTTON)
      .click();

    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '10',
    );

    // Try to exceed max value again (should stay at max)
    await component
      .getByTestId(TEST_SELECTORS.NUMERIC_FIELD_INCREMENT_BUTTON)
      .click();

    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '10',
    );

    // Click decrement multiple times
    await component
      .getByTestId(TEST_SELECTORS.NUMERIC_FIELD_DECREMENT_BUTTON)
      .click();

    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '9',
    );

    await component
      .getByTestId(TEST_SELECTORS.NUMERIC_FIELD_DECREMENT_BUTTON)
      .click();

    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '8',
    );

    // Try to go below min value
    for (let i = 0; i < 10; i++) {
      await component
        .getByTestId(TEST_SELECTORS.NUMERIC_FIELD_DECREMENT_BUTTON)
        .click();
    }

    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '0',
    );

    // Try to go below min value again (should stay at min)
    await component
      .getByTestId(TEST_SELECTORS.NUMERIC_FIELD_DECREMENT_BUTTON)
      .click();

    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '0',
    );
  });

  test('shows slider when focused and min/max are defined', async ({
    mount,
  }) => {
    const component = await mount(
      'components/common/numeric-input-field/Default',
    );

    // Slider should not be initially visible
    const sliderBefore = component.getByTestId('numeric-slider');
    await expect(sliderBefore).toHaveCount(0);

    // Focus the input to show the slider
    await component.locator('input[data-slot="input"]').focus();

    // Now the slider should be visible
    const sliderAfter = component.getByTestId('numeric-slider');
    await expect(sliderAfter).toBeVisible();

    // Check that min and max values are displayed
    await expect(component).toContainText('0°C');
    await expect(component).toContainText('100°C');
  });

  test('clamps decrement from an empty value to min', async ({ mount }) => {
    const component = await mount<typeof Stateful>(
      'components/common/numeric-input-field/Stateful',
      { initialValue: null, min: 0, max: 10, defaultValue: 0, unit: 'items' },
    );

    const decrement = component.getByTestId(
      TEST_SELECTORS.NUMERIC_FIELD_DECREMENT_BUTTON,
    );
    await expect(decrement).toHaveAttribute('aria-label', /.+/);
    await expect(
      component.getByTestId(TEST_SELECTORS.NUMERIC_FIELD_INCREMENT_BUTTON),
    ).toHaveAttribute('aria-label', /.+/);
    await decrement.click();

    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '0',
    );
    await expect(component.getByTestId('field-value')).toHaveValue('0');
  });

  test('accepts fractional values when decimalPlaces is set', async ({
    mount,
  }) => {
    const component = await mount<typeof Stateful>(
      'components/common/numeric-input-field/Stateful',
      {
        initialValue: 0,
        min: 0,
        max: 10,
        defaultValue: 0,
        step: 0.5,
        decimalPlaces: 2,
        unit: 'L',
      },
    );

    const input = component.locator('input[data-slot="input"]');
    await input.fill('0.5');

    await expect(input).toHaveValue('0.5');
    await expect(component.getByTestId('field-value')).toHaveValue('0.5');

    await component
      .getByTestId(TEST_SELECTORS.NUMERIC_FIELD_INCREMENT_BUTTON)
      .click();
    await expect(input).toHaveValue('1');
  });

  test('allows direct input value changes', async ({ mount }) => {
    const component = await mount<typeof Stateful>(
      'components/common/numeric-input-field/Stateful',
      { initialValue: 5, min: 0, max: 100, defaultValue: 5, unit: 'items' },
    );

    // Change value directly in the input
    await component.locator('input[data-slot="input"]').fill('42');
    await component.locator('input[data-slot="input"]').blur();

    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '42',
    );
    await expect(component.getByTestId('field-value')).toHaveValue('42');

    // Try invalid value (below min)
    await component.locator('input[data-slot="input"]').fill('-10');
    await component.locator('input[data-slot="input"]').blur();

    // In the new implementation, invalid values are not accepted, so the value remains unchanged
    await expect(component.locator('input[data-slot="input"]')).toHaveValue(
      '42',
    );
  });
});
