import { z } from 'zod';

export enum BoxTypeEnum {
  BROOD = 'BROOD',
  HONEY = 'HONEY',
  FEEDER = 'FEEDER',
}

export enum BoxVariantEnum {
  LANGSTROTH_DEEP = 'LANGSTROTH_DEEP',
  LANGSTROTH_SHALLOW = 'LANGSTROTH_SHALLOW',
  B_DEEP = 'B_DEEP',
  B_SHALLOW = 'B_SHALLOW',
  DADANT = 'DADANT',
  NATIONAL_DEEP = 'NATIONAL_DEEP',
  NATIONAL_SHALLOW = 'NATIONAL_SHALLOW',
  WARRE = 'WARRE',
  TOP_BAR = 'TOP_BAR',
  CUSTOM = 'CUSTOM',
}

export const boxTypeSchema = z.nativeEnum(BoxTypeEnum);
export const boxVariantSchema = z.nativeEnum(BoxVariantEnum);

// Hex color validation regex
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const boxSchema = z.object({
  id: z.string().uuid().optional(),
  position: z.number().int().min(0),
  frameCount: z.number().int().min(1),
  hasExcluder: z.boolean(),
  type: boxTypeSchema,
  maxFrameCount: z.number().int().min(1).optional(),
  variant: boxVariantSchema.optional(),
  color: z.string().regex(hexColorRegex, 'Invalid hex color').optional(),
});

export const updateHiveBoxesSchema = z.object({
  boxes: z.array(boxSchema),
});

export type BoxType = z.infer<typeof boxTypeSchema>;
export type BoxVariant = z.infer<typeof boxVariantSchema>;
export type Box = z.infer<typeof boxSchema>;
export type UpdateHiveBoxes = z.infer<typeof updateHiveBoxesSchema>;