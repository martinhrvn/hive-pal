import { z } from 'zod';

/**
 * Feeding domain model: feed-type registry (built-in + user-defined), unit
 * conversion via density, and the derived sugar mass. Shared by frontend and
 * backend so both agree on the math.
 *
 * Conventions:
 * - Mass is canonicalised to grams (`amountG`), the source of truth for
 *   analytics. Liquid feeds may be entered by volume and are converted using
 *   the feed type's density (g/ml at ~20 °C).
 * - `sugarContent` is % sugar by weight (w/w). The derived sugar mass is
 *   stored on the feeding event so history stays stable even if a feed type's
 *   spec is edited later.
 */

/** Physical form of a feed — drives which entry units make sense. */
export const FEED_FORMS = [
  'SYRUP',
  'INVERT_SYRUP',
  'FONDANT',
  'CANDY',
  'DRY_SUGAR',
  'HONEY',
  'PROTEIN',
  'OTHER',
] as const;
export const feedFormSchema = z.enum(FEED_FORMS);
export type FeedForm = z.infer<typeof feedFormSchema>;

/** Units a feeding amount can be entered in. */
export const FEED_ENTRY_UNITS = ['g', 'kg', 'ml', 'l'] as const;
export const feedEntryUnitSchema = z.enum(FEED_ENTRY_UNITS);
export type FeedEntryUnit = z.infer<typeof feedEntryUnitSchema>;

const FEED_UNIT_INFO: Record<
  FeedEntryUnit,
  { kind: 'mass' | 'volume'; factor: number }
> = {
  g: { kind: 'mass', factor: 1 },
  kg: { kind: 'mass', factor: 1000 },
  ml: { kind: 'volume', factor: 1 },
  l: { kind: 'volume', factor: 1000 },
};

export const isVolumeFeedUnit = (unit: FeedEntryUnit): boolean =>
  FEED_UNIT_INFO[unit].kind === 'volume';

/**
 * Converts an entered feeding amount to canonical grams.
 * Volume units need the feed's density (g/ml); returns null when it's missing.
 */
export const feedAmountToGrams = (
  amount: number,
  unit: FeedEntryUnit,
  density?: number | null,
): number | null => {
  const info = FEED_UNIT_INFO[unit];
  if (info.kind === 'mass') return amount * info.factor;
  if (density == null || density <= 0) return null;
  return amount * info.factor * density;
};

/** Grams of actual sugar in `amountG` of feed at `sugarContent` % w/w. */
export const feedSugarGrams = (
  amountG: number,
  sugarContent: number,
): number => (amountG * sugarContent) / 100;

export interface FeedTypeSpec {
  id: string;
  label: string;
  form: FeedForm;
  /** g/ml at ~20 °C; null → weight-only entry (solid feeds). */
  density: number | null;
  /** % sugar by weight (w/w). */
  sugarContent: number;
}

/**
 * Built-in feed types with literature/manufacturer values:
 * - 1:1 syrup ≈ 50 % w/w, ~1.23 g/ml; 3:2 ≈ 61.5 %, ~1.31; 2:1 ≈ 66.7 %, ~1.33
 * - Apiinvert (Südzucker): 72.7 % sugar w/w, ~1.28 g/ml (1 L ≈ 1 kg sugar)
 * - Fondant (e.g. Apifonda/Ambrosia): ~88 % dry sugar, weight-only
 * - Honey: ~80 % sugars, ~1.42 g/ml
 * Protein feeds default to 0 % — their sugar share varies too much to assume;
 * users can define a custom type with a known value.
 */
export const BUILTIN_FEED_TYPES: readonly FeedTypeSpec[] = [
  { id: 'SYRUP_1_1', label: 'Syrup 1:1', form: 'SYRUP', density: 1.23, sugarContent: 50 },
  { id: 'SYRUP_3_2', label: 'Syrup 3:2', form: 'SYRUP', density: 1.31, sugarContent: 61.5 },
  { id: 'SYRUP_2_1', label: 'Syrup 2:1', form: 'SYRUP', density: 1.33, sugarContent: 66.7 },
  { id: 'APIINVERT', label: 'Apiinvert', form: 'INVERT_SYRUP', density: 1.28, sugarContent: 72.7 },
  { id: 'FONDANT', label: 'Fondant', form: 'FONDANT', density: null, sugarContent: 88 },
  { id: 'CANDY', label: 'Candy', form: 'CANDY', density: null, sugarContent: 100 },
  { id: 'DRY_SUGAR', label: 'Dry sugar', form: 'DRY_SUGAR', density: null, sugarContent: 100 },
  { id: 'HONEY', label: 'Honey', form: 'HONEY', density: 1.42, sugarContent: 80 },
  { id: 'POLLEN_PATTY', label: 'Pollen patty', form: 'PROTEIN', density: null, sugarContent: 0 },
  { id: 'PROTEIN_CANDY', label: 'Protein candy', form: 'PROTEIN', density: null, sugarContent: 0 },
] as const;

export const getBuiltinFeedType = (id: string): FeedTypeSpec | undefined =>
  BUILTIN_FEED_TYPES.find(f => f.id === id);

/**
 * Maps a legacy feeding record (feedType + optional concentration) onto a
 * built-in feed type, so old records can be interpreted with the v2 math.
 * Returns undefined for custom free-text feed types.
 */
export const legacyFeedToBuiltinId = (
  feedType: string,
  concentration?: string | null,
): string | undefined => {
  switch (feedType.toUpperCase()) {
    case 'SYRUP':
      if (concentration === '2:1') return 'SYRUP_2_1';
      if (concentration === '3:2') return 'SYRUP_3_2';
      return 'SYRUP_1_1';
    case 'HONEY':
      return 'HONEY';
    case 'CANDY':
      return 'CANDY';
    case 'POLLEN_PATTY':
      return 'POLLEN_PATTY';
    case 'PROTEIN_CANDY':
      return 'PROTEIN_CANDY';
    default:
      return undefined;
  }
};

// ---------------------------------------------------------------------------
// User-defined feed types (per user, managed in settings)
// ---------------------------------------------------------------------------

export const userFeedTypeSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(80),
  form: feedFormSchema,
  /** g/ml; null for solid feeds (weight-only entry). */
  density: z.number().positive().max(2).nullable(),
  sugarContent: z.number().min(0).max(100),
  archived: z.boolean(),
});
export type UserFeedTypeResponse = z.infer<typeof userFeedTypeSchema>;

export const createUserFeedTypeSchema = userFeedTypeSchema.omit({
  id: true,
  archived: true,
});
export type CreateUserFeedType = z.infer<typeof createUserFeedTypeSchema>;

export const updateUserFeedTypeSchema = createUserFeedTypeSchema
  .partial()
  .extend({ archived: z.boolean().optional() });
export type UpdateUserFeedType = z.infer<typeof updateUserFeedTypeSchema>;
