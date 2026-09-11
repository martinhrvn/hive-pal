// Dimensioned unit engine for treatment dosing.
//
// Goal: given an amount of product applied (in some unit) and a single active
// ingredient's concentration (in some basis), compute the mass of that active
// ingredient in **milligrams**. Concentrations can be per volume, per mass or
// per count; amounts can be volume, mass or count. When the amount's dimension
// differs from the concentration's basis (e.g. concentration in mg/ml but the
// amount was recorded in grams), the product's **density (g/ml)** bridges
// volume<->mass. If bridging is impossible (missing density, or count vs.
// volume/mass), the result is flagged `incomplete` instead of guessed.

import type { ConcentrationUnit } from './treatment-product.schema';

export type Dimension = 'VOLUME' | 'MASS' | 'COUNT';

// Amount units -> { dimension, factor to that dimension's base }.
// Bases: volume = ml, mass = g, count = piece.
const AMOUNT_UNITS: Record<string, { dim: Dimension; toBase: number }> = {
  // volume (base ml)
  ml: { dim: 'VOLUME', toBase: 1 },
  l: { dim: 'VOLUME', toBase: 1000 },
  L: { dim: 'VOLUME', toBase: 1000 },
  'fl oz': { dim: 'VOLUME', toBase: 29.5735 },
  qt: { dim: 'VOLUME', toBase: 946.353 },
  gal: { dim: 'VOLUME', toBase: 3785.41 },
  // mass (base g)
  mg: { dim: 'MASS', toBase: 0.001 },
  g: { dim: 'MASS', toBase: 1 },
  kg: { dim: 'MASS', toBase: 1000 },
  oz: { dim: 'MASS', toBase: 28.3495 },
  lb: { dim: 'MASS', toBase: 453.592 },
  // count (base piece)
  pcs: { dim: 'COUNT', toBase: 1 },
  piece: { dim: 'COUNT', toBase: 1 },
  strip: { dim: 'COUNT', toBase: 1 },
  strips: { dim: 'COUNT', toBase: 1 },
};

export function amountUnitDimension(unit: string): Dimension | null {
  return AMOUNT_UNITS[unit]?.dim ?? null;
}

/** Normalize an amount to its dimension's base unit (ml / g / piece). */
export function amountToBase(
  amount: number,
  unit: string,
): { dim: Dimension; value: number } | null {
  const u = AMOUNT_UNITS[unit];
  if (!u) return null;
  return { dim: u.dim, value: amount * u.toBase };
}

// Concentration -> { basis dimension, mg per base unit of that dimension }.
// Bases: VOLUME -> mg per ml, MASS -> mg per g, COUNT -> mg per piece.
export function concentrationToMgPerBase(
  concentration: number,
  unit: ConcentrationUnit,
): { dim: Dimension; mgPerBase: number } {
  switch (unit) {
    case 'mg/ml':
      return { dim: 'VOLUME', mgPerBase: concentration };
    case 'g/l':
      // 1 g/l = 1000 mg / 1000 ml = 1 mg/ml
      return { dim: 'VOLUME', mgPerBase: concentration };
    case 'mg/g':
      return { dim: 'MASS', mgPerBase: concentration };
    case '%w/w':
      // 1 % w/w = 1 g per 100 g = 10 mg per g
      return { dim: 'MASS', mgPerBase: concentration * 10 };
    case 'mg/piece':
      return { dim: 'COUNT', mgPerBase: concentration };
    default: {
      // Exhaustiveness guard
      const _never: never = unit;
      return _never;
    }
  }
}

export interface AppliedMassInput {
  amount: number | null | undefined;
  amountUnit: string;
  concentration: number;
  concentrationUnit: ConcentrationUnit;
  /** Product density in g/ml — only consulted when volume<->mass bridging is needed. */
  density?: number | null;
}

export interface AppliedMassResult {
  /** Applied active-ingredient mass in mg, or null if it could not be computed. */
  mg: number | null;
  incomplete: boolean;
  reason?: string;
}

/**
 * Compute the applied active-ingredient mass (mg) for one composition entry.
 * Returns `{ mg: null, incomplete: true, reason }` when it cannot be normalized.
 */
export function computeAppliedMassMg(input: AppliedMassInput): AppliedMassResult {
  const { amount, amountUnit, concentration, concentrationUnit, density } =
    input;

  if (amount == null || !Number.isFinite(amount)) {
    return { mg: null, incomplete: true, reason: 'no-amount' };
  }
  const a = amountToBase(amount, amountUnit);
  if (!a) {
    return { mg: null, incomplete: true, reason: 'unknown-amount-unit' };
  }
  const c = concentrationToMgPerBase(concentration, concentrationUnit);

  // Same dimension: direct multiply.
  if (a.dim === c.dim) {
    return { mg: a.value * c.mgPerBase, incomplete: false };
  }

  // Bridging volume <-> mass via density.
  if (
    (a.dim === 'VOLUME' && c.dim === 'MASS') ||
    (a.dim === 'MASS' && c.dim === 'VOLUME')
  ) {
    if (!density || !Number.isFinite(density) || density <= 0) {
      return { mg: null, incomplete: true, reason: 'density-required' };
    }
    if (a.dim === 'VOLUME') {
      // ml -> g via density (g/ml), then * mgPerG
      const grams = a.value * density;
      return { mg: grams * c.mgPerBase, incomplete: false };
    }
    // MASS amount vs VOLUME concentration: g -> ml via density, then * mgPerMl
    const ml = a.value / density;
    return { mg: ml * c.mgPerBase, incomplete: false };
  }

  // COUNT vs VOLUME/MASS (or vice versa) cannot be reconciled.
  return { mg: null, incomplete: true, reason: 'incompatible-dimensions' };
}

export interface ProductLikeForMass {
  density?: number | null;
  ingredients: Array<{
    activeIngredientId: string;
    concentration: number;
    concentrationUnit: ConcentrationUnit;
  }>;
}

/**
 * For one applied treatment (amount + product), compute the mass (mg) of each
 * active ingredient. Returns a map keyed by activeIngredientId with the mass and
 * whether that entry was incomplete.
 */
export function computeTreatmentIngredientMasses(
  amount: number | null | undefined,
  amountUnit: string,
  product: ProductLikeForMass,
): Record<string, AppliedMassResult> {
  const out: Record<string, AppliedMassResult> = {};
  for (const ing of product.ingredients) {
    out[ing.activeIngredientId] = computeAppliedMassMg({
      amount,
      amountUnit,
      concentration: ing.concentration,
      concentrationUnit: ing.concentrationUnit,
      density: product.density,
    });
  }
  return out;
}
