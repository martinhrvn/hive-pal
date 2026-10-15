import { test, expect, type Page } from '@playwright/test';

const STORY = 'pages/hive/components/hive-list/HiveCardStory';
const HIVE_ID = '11111111-1111-4111-8111-111111111111';

// The stretched name link covers the photo, so Playwright's own click would
// report the photo as covered. Click the screen point instead, like a user.
const clickCenterOf = async (page: Page, selector: string) => {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`${selector} not rendered`);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};

for (const imageMode of ['banner', 'side'] as const) {
  test(`clicking the hive photo opens the hive (${imageMode})`, async ({
    mount,
    page,
  }) => {
    await mount(STORY, { imageMode });

    await clickCenterOf(page, 'img[alt="Volk 7 photo"]');

    await expect(page.getByText(`Hive detail ${HIVE_ID}`)).toBeVisible();
  });
}

test('clicking the box-colour fallback opens the hive', async ({
  mount,
  page,
}) => {
  await mount(STORY, { withPhoto: false });

  // The fallback fills the top of the card in banner mode.
  const card = await page.locator('[data-slot="card"]').boundingBox();
  if (!card) throw new Error('card not rendered');
  await page.mouse.click(card.x + card.width / 2, card.y + 40);

  await expect(page.getByText(`Hive detail ${HIVE_ID}`)).toBeVisible();
});

test('the warnings pill opens its popover without leaving the card', async ({
  mount,
  page,
}) => {
  await mount(STORY, { withWarnings: true });

  await page.getByRole('button', { name: 'Inspection Warnings' }).click();

  await expect(page.getByText('Swarm preparation detected')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Volk 7' })).toBeVisible();
});

test('keyboard focus lands on the hive link', async ({ mount, page }) => {
  await mount(STORY, {});

  await page.keyboard.press('Tab');

  await expect(page.getByRole('link', { name: 'Volk 7' })).toBeFocused();
});
