import { test, expect } from '@playwright/experimental-ct-react';
import { MemoryRouter } from 'react-router-dom';
import { HiveProvenance } from './hive-provenance';
import type { HiveDetailResponse } from 'shared-schemas';

const base = {
  id: 'hive-1',
  name: 'Volk 7',
  apiaryId: 'apiary-1',
  status: 'ACTIVE',
  boxes: [],
} as unknown as HiveDetailResponse;

test('shows the mother as a "split from" link', async ({ mount, page }) => {
  const hive = {
    ...base,
    parentHive: { id: 'mother-9', name: 'Volk 3', status: 'ACTIVE' },
    offspring: [],
  } as unknown as HiveDetailResponse;

  const component = await mount(
    <MemoryRouter>
      <HiveProvenance hive={hive} />
    </MemoryRouter>,
  );

  await expect(page.getByText('Split from')).toBeVisible();
  const link = component.getByRole('link', { name: /Volk 3/ });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/hives/mother-9');
});

test('lists offspring hives with links', async ({ mount, page }) => {
  const hive = {
    ...base,
    parentHive: null,
    offspring: [
      { id: 'child-1', name: 'Ableger A', status: 'ACTIVE' },
      { id: 'child-2', name: 'Ableger B', status: 'ACTIVE' },
    ],
  } as unknown as HiveDetailResponse;

  const component = await mount(
    <MemoryRouter>
      <HiveProvenance hive={hive} />
    </MemoryRouter>,
  );

  await expect(page.getByText('Offspring')).toBeVisible();
  await expect(
    component.getByRole('link', { name: 'Ableger A' }),
  ).toHaveAttribute('href', '/hives/child-1');
  await expect(
    component.getByRole('link', { name: 'Ableger B' }),
  ).toHaveAttribute('href', '/hives/child-2');
});

test('renders nothing without provenance', async ({ mount }) => {
  const hive = {
    ...base,
    parentHive: null,
    offspring: [],
  } as unknown as HiveDetailResponse;

  const component = await mount(
    <MemoryRouter>
      <HiveProvenance hive={hive} />
    </MemoryRouter>,
  );

  await expect(component).toBeEmpty();
});
