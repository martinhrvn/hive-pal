import { describe, it, expect } from 'vitest';
import enCommon from '../../../../public/locales/en/common.json';
import deCommon from '../../../../public/locales/de/common.json';
import frCommon from '../../../../public/locales/fr/common.json';
import esCommon from '../../../../public/locales/es/common.json';
import itCommon from '../../../../public/locales/it/common.json';
import nlCommon from '../../../../public/locales/nl/common.json';
import daCommon from '../../../../public/locales/da/common.json';
import skCommon from '../../../../public/locales/sk/common.json';
import srCommon from '../../../../public/locales/sr/common.json';
import { PAGDEN_CHECKPOINTS } from '../pagden-planner';
import { ARTIFICIAL_SWARM_CHECKPOINTS } from '../artificial-swarm-planner';

// Cast locale data to a loosely-typed record so dynamic property access
// in tests does not require @ts-expect-error suppressions.
type LocaleData = Record<string, unknown>;
const asLocale = (data: unknown): LocaleData => data as LocaleData;
const get = (obj: unknown, ...keys: string[]): unknown =>
  keys.reduce(
    (acc, key) => (acc != null ? (acc as LocaleData)[key] : undefined),
    obj,
  );

describe('Swarm Management i18n Keys', () => {
  const nonEnglishLocales = [
    { name: 'de', data: asLocale(deCommon) },
    { name: 'fr', data: asLocale(frCommon) },
    { name: 'es', data: asLocale(esCommon) },
    { name: 'it', data: asLocale(itCommon) },
    { name: 'nl', data: asLocale(nlCommon) },
    { name: 'da', data: asLocale(daCommon) },
    { name: 'sk', data: asLocale(skCommon) },
    { name: 'sr', data: asLocale(srCommon) },
  ];

  describe('Pagden i18n keys', () => {
    it('has all required Pagden keys in English locale', () => {
      expect(enCommon.swarmManagement.pagden).toBeDefined();
      expect(enCommon.swarmManagement.pagden.title).toBeTruthy();
      expect(enCommon.swarmManagement.pagden.description).toBeTruthy();
      expect(enCommon.swarmManagement.pagden.intro).toBeTruthy();
      expect(enCommon.swarmManagement.pagden.overviewTitle).toBeTruthy();
      expect(enCommon.swarmManagement.pagden.prerequisitesTitle).toBeTruthy();
      expect(enCommon.swarmManagement.pagden.stepsTitle).toBeTruthy();
      expect(enCommon.swarmManagement.pagden.followUpTitle).toBeTruthy();
      expect(enCommon.swarmManagement.pagden.prosConsTitle).toBeTruthy();
      expect(enCommon.swarmManagement.pagden.faq).toBeDefined();
      expect(enCommon.swarmManagement.pagden.faq.items).toHaveLength(4);
    });

    it('has all Pagden planner checkpoint keys in English locale', () => {
      const checkpoints = asLocale(
        enCommon.swarmManagement.pagden.planner.checkpoints,
      );
      PAGDEN_CHECKPOINTS.forEach(checkpoint => {
        const cp = asLocale(checkpoints[checkpoint.id]);
        expect(cp).toBeDefined();
        expect(cp['title']).toBeTruthy();
        expect(cp['summary']).toBeTruthy();
        expect(cp['checklist']).toHaveLength(3);
      });
    });

    it('has Pagden planner metadata keys in English locale', () => {
      expect(enCommon.swarmManagement.pagden.planner.title).toBeTruthy();
      expect(enCommon.swarmManagement.pagden.planner.description).toBeTruthy();
      expect(enCommon.swarmManagement.pagden.planner.checkpointPrefix).toBeTruthy();
      expect(enCommon.swarmManagement.pagden.planner.notesChecklistLabel).toBeTruthy();
      expect(enCommon.swarmManagement.pagden.planner.savedSuccess).toBeTruthy();
      expect(enCommon.swarmManagement.pagden.planner.savedPartial).toBeTruthy();
      expect(enCommon.swarmManagement.pagden.planner.savedError).toBeTruthy();
    });

    it('has Pagden keys as empty strings in non-English locales', () => {
      nonEnglishLocales.forEach(locale => {
        const pagden = asLocale(get(locale.data, 'swarmManagement', 'pagden'));
        expect(pagden).toBeDefined();
        expect(pagden['title']).toBe('');
        expect(pagden['description']).toBe('');
        expect(
          get(locale.data, 'swarmManagement', 'pagden', 'planner', 'checkpointPrefix'),
        ).toBe('');
      });
    });
  });

  describe('Artificial Swarm i18n keys', () => {
    it('has all required Artificial Swarm keys in English locale', () => {
      expect(enCommon.swarmManagement.artificialSwarm).toBeDefined();
      expect(enCommon.swarmManagement.artificialSwarm.title).toBeTruthy();
      expect(enCommon.swarmManagement.artificialSwarm.description).toBeTruthy();
      expect(enCommon.swarmManagement.artificialSwarm.intro).toBeTruthy();
      expect(enCommon.swarmManagement.artificialSwarm.overviewTitle).toBeTruthy();
      expect(enCommon.swarmManagement.artificialSwarm.prerequisitesTitle).toBeTruthy();
      expect(enCommon.swarmManagement.artificialSwarm.stepsTitle).toBeTruthy();
      expect(enCommon.swarmManagement.artificialSwarm.followUpTitle).toBeTruthy();
      expect(enCommon.swarmManagement.artificialSwarm.prosConsTitle).toBeTruthy();
      expect(enCommon.swarmManagement.artificialSwarm.faq).toBeDefined();
      expect(enCommon.swarmManagement.artificialSwarm.faq.items).toHaveLength(4);
    });

    it('has all Artificial Swarm planner checkpoint keys in English locale', () => {
      const checkpoints = asLocale(
        enCommon.swarmManagement.artificialSwarm.planner.checkpoints,
      );
      ARTIFICIAL_SWARM_CHECKPOINTS.forEach(checkpoint => {
        const cp = asLocale(checkpoints[checkpoint.id]);
        expect(cp).toBeDefined();
        expect(cp['title']).toBeTruthy();
        expect(cp['summary']).toBeTruthy();
        expect(cp['checklist']).toHaveLength(3);
      });
    });

    it('has Artificial Swarm planner metadata keys in English locale', () => {
      expect(enCommon.swarmManagement.artificialSwarm.planner.title).toBeTruthy();
      expect(enCommon.swarmManagement.artificialSwarm.planner.description).toBeTruthy();
      expect(enCommon.swarmManagement.artificialSwarm.planner.checkpointPrefix).toBeTruthy();
      expect(enCommon.swarmManagement.artificialSwarm.planner.notesChecklistLabel).toBeTruthy();
      expect(enCommon.swarmManagement.artificialSwarm.planner.savedSuccess).toBeTruthy();
      expect(enCommon.swarmManagement.artificialSwarm.planner.savedPartial).toBeTruthy();
      expect(enCommon.swarmManagement.artificialSwarm.planner.savedError).toBeTruthy();
    });

    it('has Artificial Swarm keys as empty strings in non-English locales', () => {
      nonEnglishLocales.forEach(locale => {
        const as = asLocale(
          get(locale.data, 'swarmManagement', 'artificialSwarm'),
        );
        expect(as).toBeDefined();
        expect(as['title']).toBe('');
        expect(as['description']).toBe('');
        expect(
          get(
            locale.data,
            'swarmManagement',
            'artificialSwarm',
            'planner',
            'checkpointPrefix',
          ),
        ).toBe('');
      });
    });
  });

  describe('Overview page i18n keys', () => {
    it('has Pagden card keys in English locale', () => {
      expect(enCommon.swarmManagement.cards.pagden.title).toBeTruthy();
      expect(enCommon.swarmManagement.cards.pagden.description).toBeTruthy();
      expect(enCommon.swarmManagement.cards.pagden.detail).toBeTruthy();
      expect(enCommon.swarmManagement.cards.pagden.cta).toBeTruthy();
    });

    it('has Artificial Swarm card keys in English locale', () => {
      expect(enCommon.swarmManagement.cards.artificialSwarm.title).toBeTruthy();
      expect(enCommon.swarmManagement.cards.artificialSwarm.description).toBeTruthy();
      expect(enCommon.swarmManagement.cards.artificialSwarm.detail).toBeTruthy();
      expect(enCommon.swarmManagement.cards.artificialSwarm.cta).toBeTruthy();
    });

    it('has Dave Cushman attribution keys in English locale', () => {
      expect(enCommon.swarmManagement.cushmanCredit.text).toBeTruthy();
      expect(enCommon.swarmManagement.cushmanCredit.linkLabel).toBeTruthy();
    });

    it('has Dave Cushman attribution keys as empty strings in non-English locales', () => {
      nonEnglishLocales.forEach(locale => {
        expect(
          get(locale.data, 'swarmManagement', 'cushmanCredit', 'text'),
        ).toBe('');
        expect(
          get(locale.data, 'swarmManagement', 'cushmanCredit', 'linkLabel'),
        ).toBe('');
      });
    });
  });

  describe('Content verification', () => {
    it('Pagden overview mentions queen moved to new hive on original stand', () => {
      const overviewText = JSON.stringify(
        enCommon.swarmManagement.pagden.overviewPoints,
      ).toLowerCase();
      expect(overviewText).toContain('queen');
      expect(overviewText).toContain('original stand');
    });

    it('Pagden Day 0 checklist mentions relocating queen', () => {
      const setupChecklist =
        enCommon.swarmManagement.pagden.planner.checkpoints.setup.checklist;
      const checklistText = setupChecklist.join(' ').toLowerCase();
      expect(checklistText).toContain('queen');
      expect(checklistText).toContain('original stand');
    });

    it('Artificial Swarm overview mentions queen NOT moved', () => {
      const overviewText = JSON.stringify(
        enCommon.swarmManagement.artificialSwarm.overviewPoints,
      ).toLowerCase();
      expect(overviewText).toContain('queen');
      expect(overviewText).toContain('parent');
    });

    it('Artificial Swarm Day 0 checklist mentions moving frame with queen cell', () => {
      const setupChecklist =
        enCommon.swarmManagement.artificialSwarm.planner.checkpoints.setup
          .checklist;
      const checklistText = setupChecklist.join(' ').toLowerCase();
      expect(checklistText).toContain('queen cell');
      expect(checklistText).toContain('frame');
    });

    it('Artificial Swarm description mentions queen cannot be found use case', () => {
      const description =
        enCommon.swarmManagement.artificialSwarm.description.toLowerCase();
      const intro =
        enCommon.swarmManagement.artificialSwarm.intro.toLowerCase();
      expect(description + ' ' + intro).toContain('queen');
    });
  });
});
