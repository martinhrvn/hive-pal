import { BroodTimelinePage } from 'page-objects';
import { expect, GUIDE_MODE, test } from './guide.fixture';

/** A queen cell capped today was laid about eight days ago. */
const CELL_AGE_DAYS = 8;

// A short on a free tool: no account, so it starts logged out. CI runs it
// as a plain test on desktop; it is only recorded in the mobile pass.
test.describe('Guides', { tag: ['@guide'] }, () => {
  test('Queen cell timing', async ({ page, g }, testInfo) => {
    test.skip(
      GUIDE_MODE && testInfo.project.name !== 'guides-mobile',
      'short: recorded in the mobile pass only',
    );
    const tool = new BroodTimelinePage(page);
    await tool.goto();

    // A Short opens on the app, not a title card: the hook is spoken over it.
    await g.say('Found queen cells?', {
      voiceover:
        'Found queen cells in your hive? Here’s how to work out when the new queen will hatch.',
    });
    await g.point(tool.heading, 'Free, no account needed', {
      voiceover:
        'The brood timeline is one of Hive Pal’s free tools, no account needed.',
    });
    await g.do('Pick Queen', () => tool.pickCaste('Queen'), {
      target: tool.caste('Queen'),
    });
    await expect(tool.timeline).toContainText('Total: 16 days');
    await g.point(tool.timeline, 'Sixteen days, egg to queen', {
      voiceover:
        'A queen takes sixteen days: an egg, then a larva fed on royal jelly, then eight days capped in her cell.',
    });

    const laid = new Date();
    laid.setDate(laid.getDate() - CELL_AGE_DAYS);
    const emerges = new Date(laid);
    emerges.setDate(emerges.getDate() + 16);
    await g.do('When was the egg laid?', () => tool.pickLaidDate(laid), {
      target: tool.dateButton,
      voiceover:
        'Set the day the egg was laid. A cell that was just capped is about eight days old,',
    });
    const emergeDay = emerges.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    await expect(tool.stage('Adult')).toContainText(emergeDay);
    await g.point(tool.stage('Adult'), 'She emerges here', {
      voiceover:
        'and the timeline shows the day she emerges. She mates within days, then starts laying.',
    });
    await g.do('Compare All', () => tool.pickCaste('Compare All'), {
      target: tool.caste('Compare All'),
      voiceover:
        'Compare them all: workers take twenty-one days, drones twenty-four.',
    });
    await expect(tool.timeline).toContainText('Drone (24 days)');
    await g.say('Know the dates, and plan your split', {
      voiceover:
        'Know the dates, and you can plan your split before she flies.',
    });
    await g.outro({ short: true });
  });
});
