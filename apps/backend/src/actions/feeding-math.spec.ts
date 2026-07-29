import {
  BUILTIN_FEED_TYPES,
  feedAmountToGrams,
  feedSugarGrams,
  getBuiltinFeedType,
  legacyFeedToBuiltinId,
} from 'shared-schemas';

describe('feeding math (shared-schemas)', () => {
  describe('feedAmountToGrams', () => {
    it('passes mass units through', () => {
      expect(feedAmountToGrams(500, 'g', null)).toBe(500);
      expect(feedAmountToGrams(2.5, 'kg', null)).toBe(2500);
    });

    it('converts volume via density', () => {
      // 2 L of 1:1 syrup at 1.23 g/ml
      expect(feedAmountToGrams(2, 'l', 1.23)).toBeCloseTo(2460);
      expect(feedAmountToGrams(500, 'ml', 1.28)).toBeCloseTo(640);
    });

    it('returns null for volume without a density', () => {
      expect(feedAmountToGrams(2, 'l', null)).toBeNull();
      expect(feedAmountToGrams(2, 'ml', undefined)).toBeNull();
      expect(feedAmountToGrams(2, 'l', 0)).toBeNull();
    });
  });

  describe('feedSugarGrams', () => {
    it('applies the % w/w sugar content', () => {
      // 14 kg Apiinvert at 72.7 %
      expect(feedSugarGrams(14000, 72.7)).toBeCloseTo(10178);
      expect(feedSugarGrams(1000, 50)).toBe(500);
      expect(feedSugarGrams(1000, 0)).toBe(0);
    });
  });

  describe('builtin registry', () => {
    it('resolves Apiinvert with manufacturer spec', () => {
      const apiinvert = getBuiltinFeedType('APIINVERT');
      expect(apiinvert).toMatchObject({
        sugarContent: 72.7,
        density: 1.28,
        form: 'INVERT_SYRUP',
      });
    });

    it('marks solid feeds as weight-only (no density)', () => {
      for (const id of ['FONDANT', 'CANDY', 'DRY_SUGAR']) {
        expect(getBuiltinFeedType(id)?.density).toBeNull();
      }
    });

    it('has unique ids', () => {
      const ids = BUILTIN_FEED_TYPES.map(f => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('legacyFeedToBuiltinId', () => {
    it('maps legacy syrup + concentration onto the ratio types', () => {
      expect(legacyFeedToBuiltinId('SYRUP', '1:1')).toBe('SYRUP_1_1');
      expect(legacyFeedToBuiltinId('SYRUP', '2:1')).toBe('SYRUP_2_1');
      expect(legacyFeedToBuiltinId('SYRUP', '3:2')).toBe('SYRUP_3_2');
      expect(legacyFeedToBuiltinId('SYRUP', null)).toBe('SYRUP_1_1');
    });

    it('maps the other legacy types and leaves custom strings alone', () => {
      expect(legacyFeedToBuiltinId('HONEY')).toBe('HONEY');
      expect(legacyFeedToBuiltinId('CANDY')).toBe('CANDY');
      expect(legacyFeedToBuiltinId('POLLEN_PATTY')).toBe('POLLEN_PATTY');
      expect(legacyFeedToBuiltinId('My secret feed')).toBeUndefined();
    });
  });
});
