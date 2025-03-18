import { test, expect } from '@playwright/experimental-ct-react';
import NumericField from './numeric-input-field';
import { NumericInputFieldWithIcon } from '@/components/common/numeric-input-field.story.tsx';

test.describe('NumericField', () => {
  test('renders with default values', async ({ mount }) => {
    const component = await mount(
      <NumericField
        value={20}
        onChange={() => {}}
        min={0}
        max={100}
        defaultValue={20}
        unit="°C"
      />,
    );

    // Check if the component renders properly
    await expect(component.locator('input')).toHaveValue('20');
    await expect(component).toContainText('°C');
  });

  test('renders with renderIcon prop', async ({ mount, page }) => {
    await mount(<NumericInputFieldWithIcon />);

    // Check if icon renders
    await expect(page.getByTestId('input-icon')).toBeVisible();
  });

  test('handles increment and decrement buttons', async ({ mount }) => {
    let value = 5;
    const onChange = (newValue: number | null) => {
      if (newValue !== null) value = newValue;
    };

    const component = await mount(
      <NumericField
        value={value}
        onChange={onChange}
        min={0}
        max={10}
        defaultValue={5}
        unit="items"
      />,
    );

    // Initial value check
    await expect(component.locator('input')).toHaveValue('5');

    // Click increment button
    await component.locator('button').first().click();

    // We need to remount to see the new value since our local state doesn't update the component
    await component.update(
      <NumericField
        value={value}
        onChange={onChange}
        min={0}
        max={10}
        defaultValue={5}
        unit="items"
      />,
    );

    await expect(component.locator('input')).toHaveValue('6');

    // Click increment button again
    await component.locator('button').first().click();

    await component.update(
      <NumericField
        value={value}
        onChange={onChange}
        min={0}
        max={10}
        defaultValue={5}
        unit="items"
      />,
    );

    await expect(component.locator('input')).toHaveValue('7');

    // Click decrement button
    await component.locator('button').nth(1).click();

    await component.update(
      <NumericField
        value={value}
        onChange={onChange}
        min={0}
        max={10}
        defaultValue={5}
        unit="items"
      />,
    );

    await expect(component.locator('input')).toHaveValue('6');
  });

  test('respects min and max values', async ({ mount }) => {
    let value = 9;
    const onChange = (newValue: number | null) => {
      if (newValue !== null) value = newValue;
    };

    const component = await mount(
      <NumericField
        value={value}
        onChange={onChange}
        min={0}
        max={10}
        defaultValue={5}
        unit="items"
      />,
    );

    // Initial value check
    await expect(component.locator('input')).toHaveValue('9');

    // Try to exceed max value
    await component.locator('button').first().click();

    await component.update(
      <NumericField
        value={value}
        onChange={onChange}
        min={0}
        max={10}
        defaultValue={5}
        unit="items"
      />,
    );

    await expect(component.locator('input')).toHaveValue('10');

    // Try to exceed max value again (should stay at max)
    await component.locator('button').first().click();

    await component.update(
      <NumericField
        value={value}
        onChange={onChange}
        min={0}
        max={10}
        defaultValue={5}
        unit="items"
      />,
    );

    await expect(component.locator('input')).toHaveValue('10');

    // Click decrement multiple times
    await component.locator('button').nth(1).click();

    await component.update(
      <NumericField
        value={value}
        onChange={onChange}
        min={0}
        max={10}
        defaultValue={5}
        unit="items"
      />,
    );

    await expect(component.locator('input')).toHaveValue('9');

    await component.locator('button').nth(1).click();

    await component.update(
      <NumericField
        value={value}
        onChange={onChange}
        min={0}
        max={10}
        defaultValue={5}
        unit="items"
      />,
    );

    await expect(component.locator('input')).toHaveValue('8');

    // Try to go below min value
    for (let i = 0; i < 10; i++) {
      await component.locator('button').nth(1).click();

      await component.update(
        <NumericField
          value={value}
          onChange={onChange}
          min={0}
          max={10}
          defaultValue={5}
          unit="items"
        />,
      );
    }

    await expect(component.locator('input')).toHaveValue('0');

    // Try to go below min value again (should stay at min)
    await component.locator('button').nth(1).click();

    await component.update(
      <NumericField
        value={value}
        onChange={onChange}
        min={0}
        max={10}
        defaultValue={5}
        unit="items"
      />,
    );

    await expect(component.locator('input')).toHaveValue('0');
  });

  test('shows slider when focused and min/max are defined', async ({
    mount,
  }) => {
    const component = await mount(
      <NumericField
        value={20}
        onChange={() => {}}
        min={0}
        max={100}
        defaultValue={20}
        unit="°C"
      />,
    );

    // Slider should not be initially visible
    const sliderBefore = component.getByTestId('numeric-slider');
    await expect(sliderBefore).toHaveCount(0);

    // Focus the input to show the slider
    await component.locator('input').focus();

    // Now the slider should be visible
    const sliderAfter = component.getByTestId('numeric-slider');
    await expect(sliderAfter).toBeVisible();

    // Check that min and max values are displayed
    await expect(component).toContainText('0°C');
    await expect(component).toContainText('100°C');
  });

  test('allows direct input value changes', async ({ mount }) => {
    let value = 5;
    const onChange = (newValue: number | null) => {
      if (newValue !== null) value = newValue;
    };

    const component = await mount(
      <NumericField
        value={value}
        onChange={onChange}
        min={0}
        max={100}
        defaultValue={5}
        unit="items"
      />,
    );

    // Change value directly in the input
    await component.locator('input').fill('42');
    await component.locator('input').blur();

    await component.update(
      <NumericField
        value={value}
        onChange={onChange}
        min={0}
        max={100}
        defaultValue={5}
        unit="items"
      />,
    );

    await expect(component.locator('input')).toHaveValue('42');

    // Try invalid value (below min)
    await component.locator('input').fill('-10');
    await component.locator('input').blur();

    // In the new implementation, invalid values are not accepted, so the value remains unchanged
    await component.update(
      <NumericField
        value={value}
        onChange={onChange}
        min={0}
        max={100}
        defaultValue={5}
        unit="items"
      />,
    );

    await expect(component.locator('input')).toHaveValue('42');
  });
});
