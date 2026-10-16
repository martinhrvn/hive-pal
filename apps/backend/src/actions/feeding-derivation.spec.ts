import { ActionType, getBuiltinFeedType } from 'shared-schemas';
import {
  FeedingDetails,
  builtinFeedTypeId,
  deriveFeeding,
} from './feeding-derivation';

const feeding = (fields: Partial<FeedingDetails>): FeedingDetails => ({
  type: ActionType.FEEDING,
  feedType: 'SYRUP',
  amount: 2,
  unit: 'l',
  ...fields,
});

describe('builtinFeedTypeId', () => {
  it('uses a built-in feedTypeId', () => {
    expect(builtinFeedTypeId(feeding({ feedTypeId: 'APIINVERT' }))).toBe(
      'APIINVERT',
    );
  });

  it('ignores a custom feedTypeId', () => {
    expect(
      builtinFeedTypeId(
        feeding({ feedTypeId: '0b5e6a3c-8f2d-4d7e-b1a9-2c4d6e8f0a1b' }),
      ),
    ).toBeUndefined();
  });

  it('accepts a built-in id or a legacy type as feedType', () => {
    expect(builtinFeedTypeId(feeding({ feedType: 'syrup_2_1' }))).toBe(
      'SYRUP_2_1',
    );
    expect(
      builtinFeedTypeId(feeding({ feedType: 'SYRUP', concentration: '3:2' })),
    ).toBe('SYRUP_3_2');
    expect(builtinFeedTypeId(feeding({ feedType: 'My mix' }))).toBeUndefined();
  });
});

describe('deriveFeeding', () => {
  it('fills amountG and sugarG from the feed spec', () => {
    const derived = deriveFeeding(
      feeding({ feedType: 'SYRUP_1_1', amount: 2, unit: 'L' }),
      getBuiltinFeedType('SYRUP_1_1'),
    );
    expect(derived.enteredAmount).toBe(2);
    expect(derived.enteredUnit).toBe('l');
    expect(derived.density).toBe(1.23);
    expect(derived.amountG).toBeCloseTo(2460);
    expect(derived.sugarG).toBeCloseTo(1230);
  });

  it('handles weight-only feeds', () => {
    const derived = deriveFeeding(
      feeding({ feedType: 'FONDANT', amount: 1.5, unit: 'kg' }),
      getBuiltinFeedType('FONDANT'),
    );
    expect(derived.amountG).toBe(1500);
    expect(derived.sugarG).toBe(1320);
  });

  it('prefers values the client sent', () => {
    const derived = deriveFeeding(
      feeding({ enteredAmount: 500, enteredUnit: 'ml', density: 1.3 }),
      getBuiltinFeedType('SYRUP_1_1'),
    );
    expect(derived.amountG).toBeCloseTo(650);
  });

  it('keeps a free-text feed without a spec as entered', () => {
    const derived = deriveFeeding(
      feeding({ feedType: 'My mix', amount: 3, unit: 'kg' }),
      undefined,
    );
    expect(derived.amountG).toBe(3000);
    expect(derived.sugarG).toBeUndefined();
  });

  it('leaves amountG unset for a volume without a density', () => {
    const derived = deriveFeeding(
      feeding({ feedType: 'My mix', amount: 2, unit: 'l' }),
      undefined,
    );
    expect(derived.amountG).toBeUndefined();
  });
});
