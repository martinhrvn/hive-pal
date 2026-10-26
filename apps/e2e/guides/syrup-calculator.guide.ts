import { SyrupCalculatorPage } from 'page-objects';
import { expect, GUIDE_MODE, test } from './guide.fixture';

// A short on a free tool: no account, so it starts logged out. CI runs it
// as a plain test on desktop; it is only recorded in the mobile pass.
test.describe('Guides', { tag: ['@guide'] }, () => {
  test('Sugar syrup', async ({ page, g }, testInfo) => {
    test.skip(
      GUIDE_MODE && testInfo.project.name !== 'guides-mobile',
      'short: recorded in the mobile pass only',
    );
    const tool = new SyrupCalculatorPage(page);
    await tool.goto();

    // A Short opens on the app, not a title card: the hook is spoken over it.
    await g.say('How much sugar for syrup?', {
      voiceover:
        'Feeding your bees? Here’s exactly how much sugar and water goes into your syrup.',
    });
    await g.point(tool.heading, 'Free, no account needed', {
      voiceover: 'It’s one of Hive Pal’s free tools, no account needed.',
    });
    await g.do('Thick (2:1) for autumn', () => tool.choose('Thick (2:1)'), {
      target: tool.option('Thick (2:1)'),
      voiceover:
        'For autumn feeding, pick thick syrup: two parts sugar to one part water.',
    });
    await g.do('How much do you need?', () => tool.choose('10 L'), {
      target: tool.option('10 L'),
      voiceover:
        'Choose how much syrup you want to end up with, say ten litres.',
    });
    await expect(tool.result('Sugar')).toContainText('8.85 kg');
    await expect(tool.result('Water')).toContainText('4.42 L');
    await g.point(tool.result('Sugar'), 'Your shopping list', {
      voiceover:
        'That’s almost nine kilos of sugar and four and a half litres of water.',
    });
    await g.point(tool.result('Water'), 'Sugar takes up space too', {
      voiceover:
        'Less water than you’d think, because the dissolved sugar takes up room too.',
    });
    await g.do('Thin (1:1) for spring', () => tool.choose('Thin (1:1)'), {
      target: tool.option('Thin (1:1)'),
      voiceover:
        'In spring, switch to thin syrup, one to one, to get the colony building.',
    });
    await expect(tool.result('Sugar')).toContainText('6.13 kg');
    await g.point(tool.instructions, 'Mix it right', {
      voiceover:
        'Then follow the steps: warm water, never boiling, and plain white sugar.',
    });
    await g.say('Mix it, cool it, and feed it.');
    await g.outro({ short: true });
  });
});
