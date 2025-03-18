import { test, expect } from '@playwright/experimental-ct-react';
import TemperatureField from './temperature-input-field';

test.describe('TemperatureField', () => {
  test('renders with default values', async ({ mount }) => {
    const component = await mount(
      <TemperatureField value={20} onChange={() => {}} />,
    );

    // Check if the component renders properly
    await expect(component.locator('input')).toHaveValue('20');
    await expect(component).toContainText('°C');
  });

  test('renders thermometer icon', async ({ mount, page }) => {
    await mount(<TemperatureField value={20} onChange={() => {}} />);

    await expect(page.getByTestId('input-icon')).toBeVisible();
  });

  test('handles increment and decrement buttons', async ({ mount }) => {
    let value = 20;
    const onChange = (newValue: number | null) => {
      if (newValue !== null) value = newValue;
    };

    const component = await mount(
      <TemperatureField value={value} onChange={onChange} min={-10} max={40} />,
    );

    // Initial value check
    await expect(component.locator('input')).toHaveValue('20');

    // Click increment button
    await component.locator('button').first().click();

    await component.update(
      <TemperatureField value={value} onChange={onChange} min={-10} max={40} />,
    );

    await expect(component.locator('input')).toHaveValue('21');

    // Click decrement button
    await component.locator('button').nth(1).click();

    await component.update(
      <TemperatureField value={value} onChange={onChange} min={-10} max={40} />,
    );

    await expect(component.locator('input')).toHaveValue('20');
  });

  test('respects min and max temperature values', async ({ mount }) => {
    let value = 38;
    const onChange = (newValue: number | null) => {
      if (newValue !== null) value = newValue;
    };

    const component = await mount(
      <TemperatureField value={value} onChange={onChange} min={-10} max={40} />,
    );

    // Initial value check
    await expect(component.locator('input')).toHaveValue('38');

    // Try to exceed max value
    await component.locator('button').first().click();

    await component.update(
      <TemperatureField value={value} onChange={onChange} min={-10} max={40} />,
    );

    await expect(component.locator('input')).toHaveValue('39');

    await component.locator('button').first().click();

    await component.update(
      <TemperatureField value={value} onChange={onChange} min={-10} max={40} />,
    );

    await expect(component.locator('input')).toHaveValue('40');

    // Try to exceed max value again (should stay at max)
    await component.locator('button').first().click();

    await component.update(
      <TemperatureField value={value} onChange={onChange} min={-10} max={40} />,
    );

    await expect(component.locator('input')).toHaveValue('40');
  });

  test('shows slider when focused', async ({ mount }) => {
    const component = await mount(
      <TemperatureField value={20} onChange={() => {}} />,
    );

    // Slider should not be initially visible
    const sliderBefore = component.locator('numeric-slider');
    await expect(sliderBefore).toHaveCount(0);

    // Focus the input to show the slider
    await component.locator('input').focus();

    // Now the slider should be visible
    const sliderAfter = component.getByTestId('numeric-slider');
    await expect(sliderAfter).toBeVisible();
  });
});
