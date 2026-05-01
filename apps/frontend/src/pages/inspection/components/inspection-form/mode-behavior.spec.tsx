import { expect, test } from '@playwright/experimental-ct-react';
import {
  applyInspectionModeToFormData,
  getModeSpecificObservations,
} from './mode-behavior';
import {
  DataDrivenObservationsWithForm,
  SubjectiveObservationsWithAi,
} from './mode-behavior.story';
import type { InspectionFormData } from './schema';

test.describe('Inspection mode behavior', () => {
  test('data-driven mode hides subjective rating fields and keeps counter controls', async ({
    mount,
    page,
  }) => {
    await mount(<DataDrivenObservationsWithForm />);

    await expect(
      page.getByRole('button', { name: 'Increase Strength' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Increase Queen Cells' }),
    ).toBeVisible();
    await expect(page.getByText('Capped Brood', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Honey Stores', { exact: true })).toHaveCount(0);
  });

  test('subjective mode keeps rating interactions and AI suggestions together', async ({
    mount,
    page,
  }) => {
    await mount(<SubjectiveObservationsWithAi />);

    await expect(page.getByText('Capped Brood', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Rate as 7' }).first(),
    ).toBeVisible();
    await expect(page.getByText('AI:')).toBeVisible();
  });

  test('submit sanitization keeps only fields for the active mode', async () => {
    const formData = {
      observations: {
        strength: 8,
        cappedBrood: 6,
        honeyStores: 5,
        totalFrames: 20,
        eggsFrames: 4,
      },
      score: {
        overallScore: 8,
      },
    } as InspectionFormData;

    expect(applyInspectionModeToFormData(formData, true, 20)).toEqual({
      observations: {
        strength: 8,
        cappedBrood: 6,
        honeyStores: 5,
      },
      score: undefined,
    });

    expect(getModeSpecificObservations(formData.observations, false, 18)).toEqual({
      strength: 8,
      totalFrames: 18,
      eggsFrames: 4,
    });
  });

  test('subjective mode preserves existing subjective observations during edit flows', async () => {
    expect(
      getModeSpecificObservations(
        {
          strength: 7,
          uncappedBrood: 5,
          cappedBrood: 6,
          honeyStores: 4,
          pollenStores: 3,
          eggsFrames: 2,
        },
        true,
        20,
      ),
    ).toEqual({
      strength: 7,
      uncappedBrood: 5,
      cappedBrood: 6,
      honeyStores: 4,
      pollenStores: 3,
    });
  });

  test('data-driven mode preserves frame observations and effective box total during edit flows', async () => {
    expect(
      getModeSpecificObservations(
        {
          strength: 9,
          cappedBrood: 6,
          totalFrames: 10,
          eggsFrames: 2,
          uncappedBroodFrames: 3,
          honeyFrames: 4,
        },
        false,
        24,
      ),
    ).toEqual({
      strength: 9,
      totalFrames: 24,
      eggsFrames: 2,
      uncappedBroodFrames: 3,
      honeyFrames: 4,
    });
  });
});
