import { test, expect } from '@playwright/test';

const STORY = 'pages/queen/components/detail/virgin-queen-notice/VirginQueen';

test('counts down to the expected emergence of a capped cell', async ({
  mount,
  page,
}) => {
  // Capped 5 days ago: emerges in 3 days
  await mount(STORY, { virginDaysAgo: 5, cappedDaysAgo: 5 });

  await expect(page.getByText(/Expected to emerge in 3 days/)).toBeVisible();
  await expect(page.getByText(/Look for eggs from about/)).toBeVisible();
});

test('counts the days since emergence', async ({ mount, page }) => {
  await mount(STORY, {
    virginDaysAgo: 30,
    cappedDaysAgo: 20,
    emergedDaysAgo: 10,
  });

  await expect(page.getByText('Virgin for 10 days.')).toBeVisible();
  await expect(page.getByText(/Look for eggs from about/)).toBeVisible();
});

test('asks for an egg check after three weeks', async ({ mount, page }) => {
  await mount(STORY, { virginDaysAgo: 21 });

  await expect(page.getByText('Virgin for 21 days.')).toBeVisible();
  await expect(page.getByText(/Check for eggs/)).toBeVisible();
});
