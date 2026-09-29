import { test, expect } from '@playwright/experimental-ct-react';
import {
  PhotosForExistingInspection,
  PhotosForNewInspection,
} from './photos-section.story';

const INSPECTION_ID = '11111111-1111-1111-1111-111111111111';

const IMAGE = {
  name: 'brood-frame.jpg',
  mimeType: 'image/jpeg',
  buffer: Buffer.from('not-a-real-jpeg-but-enough-for-an-upload'),
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/features', route =>
    route.fulfill({ json: { storageEnabled: true, aiEnabled: false } }),
  );
  await page.route(`**/api/inspections/${INSPECTION_ID}/photos`, route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: [] });
    return route.continue();
  });
});

test('reports it when the API rejects the upload', async ({ mount, page }) => {
  await page.route(`**/api/inspections/${INSPECTION_ID}/photos`, route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: [] });
    return route.fulfill({
      status: 400,
      json: { message: 'File size exceeds maximum allowed (10MB)' },
    });
  });

  const component = await mount(<PhotosForExistingInspection />);
  await component
    .locator('input[type="file"]:not([capture])')
    .setInputFiles(IMAGE);

  // Previously the rejection was swallowed and nothing happened at all.
  await expect(
    page.getByText('File size exceeds maximum allowed (10MB)'),
  ).toBeVisible();
});

test('reports it when the request never reaches the API', async ({
  mount,
  page,
}) => {
  await page.route(`**/api/inspections/${INSPECTION_ID}/photos`, route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: [] });
    // What a reverse proxy does with a body above its limit.
    return route.fulfill({ status: 413, body: 'Payload Too Large' });
  });

  const component = await mount(<PhotosForExistingInspection />);
  await component
    .locator('input[type="file"]:not([capture])')
    .setInputFiles(IMAGE);

  await expect(page.getByText(/larger than 10 MB/i)).toBeVisible();
});

test('rejects an unsupported file without contacting the API', async ({
  mount,
  page,
}) => {
  const component = await mount(<PhotosForNewInspection />);
  await component.locator('input[type="file"]:not([capture])').setInputFiles({
    name: 'notes.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  });

  await expect(page.getByText(/unsupported image format/i)).toBeVisible();
  await expect(component.locator('img')).toHaveCount(0);
});

test('shows a thumbnail for a photo picked on an unsaved inspection', async ({
  mount,
  page,
}) => {
  const component = await mount(<PhotosForNewInspection />);
  await component
    .locator('input[type="file"]:not([capture])')
    .setInputFiles(IMAGE);

  await expect(component.locator('img')).toHaveCount(1);
  await expect(page.getByText(/pending upload/i)).toBeVisible();
});
