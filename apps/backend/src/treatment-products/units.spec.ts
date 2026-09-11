import { describe, it, expect } from 'vitest';
import {
  computeAppliedMassMg,
  concentrationToMgPerBase,
  amountToBase,
  computeTreatmentIngredientMasses,
} from 'shared-schemas';

describe('concentrationToMgPerBase', () => {
  it('mg/ml -> volume basis, mg per ml', () => {
    expect(concentrationToMgPerBase(44, 'mg/ml')).toEqual({
      dim: 'VOLUME',
      mgPerBase: 44,
    });
  });
  it('g/l equals mg/ml (1 g/l = 1 mg/ml)', () => {
    expect(concentrationToMgPerBase(10, 'g/l')).toEqual({
      dim: 'VOLUME',
      mgPerBase: 10,
    });
  });
  it('%w/w -> mass basis, 1% = 10 mg/g', () => {
    expect(concentrationToMgPerBase(25, '%w/w')).toEqual({
      dim: 'MASS',
      mgPerBase: 250,
    });
  });
  it('mg/g -> mass basis', () => {
    expect(concentrationToMgPerBase(886, 'mg/g')).toEqual({
      dim: 'MASS',
      mgPerBase: 886,
    });
  });
  it('mg/piece -> count basis', () => {
    expect(concentrationToMgPerBase(500, 'mg/piece')).toEqual({
      dim: 'COUNT',
      mgPerBase: 500,
    });
  });
});

describe('amountToBase', () => {
  it('normalizes volume to ml', () => {
    expect(amountToBase(2, 'l')).toEqual({ dim: 'VOLUME', value: 2000 });
  });
  it('normalizes mass to g', () => {
    expect(amountToBase(1, 'kg')).toEqual({ dim: 'MASS', value: 1000 });
  });
  it('counts strips as pieces', () => {
    expect(amountToBase(3, 'strips')).toEqual({ dim: 'COUNT', value: 3 });
  });
  it('returns null for unknown units', () => {
    expect(amountToBase(1, 'bushels')).toBeNull();
  });
});

describe('computeAppliedMassMg — same dimension', () => {
  it('VarroMed: 30 ml at 44 mg/ml = 1320 mg oxalic acid', () => {
    expect(
      computeAppliedMassMg({
        amount: 30,
        amountUnit: 'ml',
        concentration: 44,
        concentrationUnit: 'mg/ml',
      }),
    ).toEqual({ mg: 1320, incomplete: false });
  });

  it('Apiguard: 50 g at 25 %w/w = 12500 mg (12.5 g) thymol', () => {
    expect(
      computeAppliedMassMg({
        amount: 50,
        amountUnit: 'g',
        concentration: 25,
        concentrationUnit: '%w/w',
      }),
    ).toEqual({ mg: 12500, incomplete: false });
  });

  it('Api-Bioxal: 35 g at 886 mg/g = 31010 mg oxalic acid', () => {
    expect(
      computeAppliedMassMg({
        amount: 35,
        amountUnit: 'g',
        concentration: 886,
        concentrationUnit: 'mg/g',
      }),
    ).toEqual({ mg: 31010, incomplete: false });
  });

  it('Apivar: 2 strips at 500 mg/piece = 1000 mg amitraz', () => {
    expect(
      computeAppliedMassMg({
        amount: 2,
        amountUnit: 'pcs',
        concentration: 500,
        concentrationUnit: 'mg/piece',
      }),
    ).toEqual({ mg: 1000, incomplete: false });
  });

  it('scales larger units (1 kg at 1000 mg/g = 1_000_000 mg)', () => {
    expect(
      computeAppliedMassMg({
        amount: 1,
        amountUnit: 'kg',
        concentration: 1000,
        concentrationUnit: 'mg/g',
      }).mg,
    ).toBe(1_000_000);
  });
});

describe('computeAppliedMassMg — density bridge (volume <-> mass)', () => {
  it('grams amount with mg/ml concentration: 33 g at density 1.1 -> 30 ml x 44 = 1320 mg', () => {
    const r = computeAppliedMassMg({
      amount: 33,
      amountUnit: 'g',
      concentration: 44,
      concentrationUnit: 'mg/ml',
      density: 1.1,
    });
    expect(r.incomplete).toBe(false);
    expect(r.mg).toBeCloseTo(1320, 6);
  });

  it('ml amount with mg/g concentration: 30 ml at density 1.1 -> 33 g x 886 = 29238 mg', () => {
    const r = computeAppliedMassMg({
      amount: 30,
      amountUnit: 'ml',
      concentration: 886,
      concentrationUnit: 'mg/g',
      density: 1.1,
    });
    expect(r.incomplete).toBe(false);
    expect(r.mg).toBeCloseTo(29238, 6);
  });

  it('flags incomplete when density is required but missing', () => {
    expect(
      computeAppliedMassMg({
        amount: 33,
        amountUnit: 'g',
        concentration: 44,
        concentrationUnit: 'mg/ml',
      }),
    ).toEqual({ mg: null, incomplete: true, reason: 'density-required' });
  });
});

describe('computeAppliedMassMg — incompatible / missing', () => {
  it('count amount vs volume concentration is incompatible', () => {
    expect(
      computeAppliedMassMg({
        amount: 2,
        amountUnit: 'pcs',
        concentration: 44,
        concentrationUnit: 'mg/ml',
      }),
    ).toEqual({
      mg: null,
      incomplete: true,
      reason: 'incompatible-dimensions',
    });
  });

  it('unknown amount unit is incomplete', () => {
    expect(
      computeAppliedMassMg({
        amount: 1,
        amountUnit: 'handful',
        concentration: 1,
        concentrationUnit: 'mg/g',
      }).reason,
    ).toBe('unknown-amount-unit');
  });

  it('missing amount is incomplete', () => {
    expect(
      computeAppliedMassMg({
        amount: null,
        amountUnit: 'ml',
        concentration: 44,
        concentrationUnit: 'mg/ml',
      }).reason,
    ).toBe('no-amount');
  });
});

describe('computeTreatmentIngredientMasses — full product', () => {
  it('VarroMed 30 ml yields both formic and oxalic masses', () => {
    const res = computeTreatmentIngredientMasses(30, 'ml', {
      density: null,
      ingredients: [
        { activeIngredientId: 'formic', concentration: 5, concentrationUnit: 'mg/ml' },
        { activeIngredientId: 'oxalic', concentration: 44, concentrationUnit: 'mg/ml' },
      ],
    });
    expect(res.formic).toEqual({ mg: 150, incomplete: false });
    expect(res.oxalic).toEqual({ mg: 1320, incomplete: false });
  });
});
