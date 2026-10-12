import { z } from 'zod';

// --- Enums (mirror the Prisma enums) ---

export const TreatmentPhysicalForm = {
  LIQUID: 'LIQUID',
  POWDER: 'POWDER',
  GEL: 'GEL',
  STRIP: 'STRIP',
  GASEOUS: 'GASEOUS',
} as const;
export type TreatmentPhysicalForm =
  (typeof TreatmentPhysicalForm)[keyof typeof TreatmentPhysicalForm];
export const treatmentPhysicalFormSchema = z.enum([
  'LIQUID',
  'POWDER',
  'GEL',
  'STRIP',
  'GASEOUS',
]);

export const TreatmentApplicationMethod = {
  TRICKLE: 'TRICKLE',
  SPRAY: 'SPRAY',
  SUBLIMATE: 'SUBLIMATE',
  EVAPORATE: 'EVAPORATE',
  INSERT: 'INSERT',
  OTHER: 'OTHER',
} as const;
export type TreatmentApplicationMethod =
  (typeof TreatmentApplicationMethod)[keyof typeof TreatmentApplicationMethod];
export const treatmentApplicationMethodSchema = z.enum([
  'TRICKLE',
  'SPRAY',
  'SUBLIMATE',
  'EVAPORATE',
  'INSERT',
  'OTHER',
]);

// Concentration bases. mass-per-volume (mg/ml, g/l), mass-per-mass (%w/w, mg/g),
// mass-per-count (mg/piece). Used by the units engine to normalize to mass.
export const CONCENTRATION_UNITS = [
  'mg/ml',
  'g/l',
  '%w/w',
  'mg/g',
  'mg/piece',
] as const;
export type ConcentrationUnit = (typeof CONCENTRATION_UNITS)[number];
export const concentrationUnitSchema = z.enum(CONCENTRATION_UNITS);

export const MiteCountMethod = {
  NATURAL_DROP: 'NATURAL_DROP',
  SUGAR_ROLL: 'SUGAR_ROLL',
  ALCOHOL_WASH: 'ALCOHOL_WASH',
  CO2: 'CO2',
  OTHER: 'OTHER',
} as const;
export type MiteCountMethod =
  (typeof MiteCountMethod)[keyof typeof MiteCountMethod];
export const miteCountMethodSchema = z.enum([
  'NATURAL_DROP',
  'SUGAR_ROLL',
  'ALCOHOL_WASH',
  'CO2',
  'OTHER',
]);

// --- Active ingredient ---

export const activeIngredientSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  name: z.string(),
  isBuiltIn: z.boolean(),
  createdByUserId: z.string().uuid().nullable(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type ActiveIngredient = z.infer<typeof activeIngredientSchema>;

export const createActiveIngredientSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[A-Z0-9_]+$/, 'Key must be UPPER_SNAKE_CASE'),
  name: z.string().min(2).max(120),
});
export type CreateActiveIngredientDto = z.infer<
  typeof createActiveIngredientSchema
>;

// --- Composition (one active-ingredient entry of a product) ---

export const productIngredientInputSchema = z.object({
  activeIngredientId: z.string().uuid(),
  concentration: z.number().positive(),
  concentrationUnit: concentrationUnitSchema,
});
export type ProductIngredientInput = z.infer<
  typeof productIngredientInputSchema
>;

export const productIngredientSchema = productIngredientInputSchema.extend({
  id: z.string().uuid(),
  activeIngredient: activeIngredientSchema.optional(),
});
export type ProductIngredient = z.infer<typeof productIngredientSchema>;

// --- Treatment product ---

export const treatmentProductSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(), // null = global built-in
  name: z.string(),
  physicalForm: treatmentPhysicalFormSchema,
  applicationMethod: treatmentApplicationMethodSchema.nullable(),
  defaultUnit: z.string().nullable(),
  density: z.number().positive().nullable(),
  withdrawalPeriodDays: z.number().int().nonnegative().nullable(),
  isBuiltIn: z.boolean(),
  ingredients: z.array(productIngredientSchema),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type TreatmentProduct = z.infer<typeof treatmentProductSchema>;

export const treatmentProductListSchema = z.array(treatmentProductSchema);
export type TreatmentProductList = z.infer<typeof treatmentProductListSchema>;

export const createTreatmentProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  physicalForm: treatmentPhysicalFormSchema,
  applicationMethod: treatmentApplicationMethodSchema.optional().nullable(),
  defaultUnit: z.string().max(16).optional().nullable(),
  density: z.number().positive().optional().nullable(),
  withdrawalPeriodDays: z.number().int().nonnegative().optional().nullable(),
  ingredients: z.array(productIngredientInputSchema).default([]),
});
export type CreateTreatmentProductDto = z.infer<
  typeof createTreatmentProductSchema
>;

export const updateTreatmentProductSchema =
  createTreatmentProductSchema.partial();
export type UpdateTreatmentProductDto = z.infer<
  typeof updateTreatmentProductSchema
>;

// --- Per-colony applied active-ingredient totals (reporting) ---

export const appliedIngredientTotalSchema = z.object({
  activeIngredientId: z.string().uuid(),
  key: z.string(),
  name: z.string(),
  totalMg: z.number(), // normalized mass applied over the period
  /** Number of treatment records that could not be normalized (missing density/incompatible units). */
  incompleteCount: z.number().int().nonnegative().default(0),
});
export type AppliedIngredientTotal = z.infer<
  typeof appliedIngredientTotalSchema
>;
