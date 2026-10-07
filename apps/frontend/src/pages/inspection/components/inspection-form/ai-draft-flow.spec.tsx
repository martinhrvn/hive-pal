import { test, expect } from '@playwright/experimental-ct-react';
import {
  AiDraftFlow,
  AiDraftFlowWithExistingFeeding,
  AiDraftFlowLegacyDraft,
} from './ai-draft-flow.story';

test.describe('AI inspection draft flow (canonical shape)', () => {
  test('renders per-action suggestions and accepting one merges it into the form', async ({
    mount,
    page,
  }) => {
    await mount(<AiDraftFlow />);

    // One suggestion card per action (actions are shown in the form's shape).
    await expect(page.getByText('treatmentType: OXALIC_ACID')).toBeVisible();
    await expect(page.getByText('feedType: Syrup')).toBeVisible();

    // Only the date suggestion conflicts (the form always has a default
    // date); the action suggestions are conflict-free on an empty form.
    await expect(page.getByText(/^conflicts:1$/)).toBeVisible();

    // Accept the treatment suggestion → merged into the form's actions.
    const treatmentCard = page.locator('[data-ai-field="actions.0"]');
    await treatmentCard.getByRole('button', { name: 'Accept' }).click();

    const formValues = page.locator('[data-test="form-values"]');
    await expect(formValues).toContainText('"treatmentType": "OXALIC_ACID"');
    await expect(formValues).toContainText('"amount": 30');
    // The treatment card is gone, the feeding card remains.
    await expect(page.getByText('treatmentType: OXALIC_ACID')).toHaveCount(0);
    await expect(page.getByText('feedType: Syrup')).toBeVisible();
  });

  test('weather enum value from the draft is accepted into the picker field', async ({
    mount,
    page,
  }) => {
    await mount(<AiDraftFlow />);

    const weatherField = page.locator('[data-ai-field="weatherConditions"]');
    await weatherField.getByRole('button', { name: 'Accept' }).click();

    await expect(page.locator('[data-test="form-values"]')).toContainText(
      '"weatherConditions": "sunny"',
    );
  });

  test('suggested action of an existing type is flagged as a conflict and replaces on accept', async ({
    mount,
    page,
  }) => {
    await mount(<AiDraftFlowWithExistingFeeding />);

    const feedingCard = page.locator('[data-ai-field="actions.1"]');
    await expect(
      feedingCard.getByText('Conflicts with existing value'),
    ).toBeVisible();

    await feedingCard.getByRole('button', { name: 'Accept' }).click();

    const formValues = page.locator('[data-test="form-values"]');
    // The AI feeding replaced the existing one instead of duplicating it.
    await expect(formValues).toContainText('"feedType": "Syrup"');
    await expect(formValues).not.toContainText('"feedType": "Honey"');
  });

  test('legacy form-shaped drafts degrade gracefully', async ({
    mount,
    page,
  }) => {
    await mount(<AiDraftFlowLegacyDraft />);

    // Legacy flat actions and free-text weather are dropped; valid scalars
    // (temperature, notes, observations) survive as suggestions.
    await expect(page.getByText(/^pending:/)).toBeVisible();
    await expect(page.locator('[data-ai-field^="actions."]')).toHaveCount(0);

    const temperatureField = page.locator('[data-ai-field="temperature"]');
    await temperatureField.getByRole('button', { name: 'Accept' }).click();
    await expect(page.locator('[data-test="form-values"]')).toContainText(
      '"temperature": 18',
    );
  });
});
