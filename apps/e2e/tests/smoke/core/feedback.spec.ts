import { FeedbackFormPage } from 'page-objects';
import { expect, test, uniqueName } from '../fixtures';

test.describe('Feedback', { tag: ['@core'] }, () => {
  test('submitting the feedback form shows the thank-you state', async ({
    page,
    freshUser,
  }) => {
    void freshUser;
    const feedback = new FeedbackFormPage(page);

    await test.step('open /feedback', async () => {
      await feedback.goto();
      await expect(feedback.heading).toBeVisible();
    });

    await test.step('fill in type, subject and message', async () => {
      await feedback.fill({
        type: 'Bug Report',
        subject: uniqueName('Smoke feedback'),
        message: 'Automated smoke test feedback; safe to ignore or delete.',
      });
      await expect(feedback.typeSelect).toHaveText('Bug Report');
    });

    await test.step('submit and see "Thank You!"', async () => {
      await feedback.submit();
      await expect(feedback.thankYouHeading).toBeVisible();
    });
  });
});
