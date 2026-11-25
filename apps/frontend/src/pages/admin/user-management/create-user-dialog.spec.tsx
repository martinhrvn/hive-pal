import { test, expect } from '@playwright/test';

const DEFAULT = 'pages/admin/user-management/create-user-dialog/Default';
const MAIL_DISABLED =
  'pages/admin/user-management/create-user-dialog/MailDisabled';
const EMAIL_TAKEN = 'pages/admin/user-management/create-user-dialog/EmailTaken';

// The dialog renders in a portal under <body>, so its locators hang off `page`.
test('creates a user with a generated temporary password', async ({
  mount,
  page,
}) => {
  await mount(DEFAULT);
  await page.getByTestId('open-dialog').click();

  const password = page.getByTestId('create-user-password');
  await expect(password).toHaveValue(/^[A-Za-z2-9]{16}$/);
  const generated = await password.inputValue();

  await page.getByTestId('create-user-name').fill('Bea Keeper');
  await page.getByTestId('create-user-email').fill('Bea@Example.com');
  await page.getByTestId('create-user-submit').click();

  const request = page.getByTestId('last-request');
  await expect(request).toContainText('"credential":"password"');
  await expect(request).toContainText(`"password":"${generated}"`);
  await expect(request).toContainText('"role":"USER"');
  await expect(page.getByTestId('created-password')).toHaveText(generated);
});

test('sends a setup link without a password', async ({ mount, page }) => {
  await mount(DEFAULT);
  await page.getByTestId('open-dialog').click();

  await page.getByTestId('create-user-name').fill('Bea Keeper');
  await page.getByTestId('create-user-email').fill('bea@example.com');
  await page.getByTestId('credential-setup-link').click();
  await expect(page.getByTestId('create-user-password')).toHaveCount(0);
  await page.getByTestId('create-user-submit').click();

  const request = page.getByTestId('last-request');
  await expect(request).toContainText('"credential":"setupLink"');
  await expect(request).not.toContainText('password');
  await expect(page.getByTestId('create-user-result')).toContainText(
    'bea@example.com',
  );
});

test('explains why setup links are unavailable without mail', async ({
  mount,
  page,
}) => {
  await mount(MAIL_DISABLED);
  await page.getByTestId('open-dialog').click();

  await expect(page.getByTestId('credential-setup-link')).toBeDisabled();
  await expect(page.getByTestId('mail-disabled-hint')).toBeVisible();
});

test('validates the form before calling the API', async ({ mount, page }) => {
  await mount(DEFAULT);
  await page.getByTestId('open-dialog').click();

  await page.getByTestId('create-user-email').fill('not-an-email');
  await page.getByTestId('create-user-password').fill('short');
  await page.getByTestId('create-user-submit').click();

  await expect(page.getByTestId('last-request')).toHaveText('');
  await expect(page.getByTestId('create-user-dialog')).toContainText(
    'Enter a name',
  );
});

test('marks the email as taken on a 409', async ({ mount, page }) => {
  await mount(EMAIL_TAKEN);
  await page.getByTestId('open-dialog').click();

  await page.getByTestId('create-user-name').fill('Bea Keeper');
  await page.getByTestId('create-user-email').fill('bea@example.com');
  await page.getByTestId('create-user-submit').click();

  await expect(page.getByTestId('create-user-dialog')).toContainText(
    'A user with this email already exists',
  );
  await expect(page.getByTestId('create-user-result')).toHaveCount(0);
});

test('starts from a fresh form each time it opens', async ({ mount, page }) => {
  await mount(DEFAULT);
  await page.getByTestId('open-dialog').click();
  await page.getByTestId('create-user-name').fill('Draft');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('create-user-dialog')).toHaveCount(0);

  await page.getByTestId('open-dialog').click();
  await expect(page.getByTestId('create-user-name')).toHaveValue('');
});
