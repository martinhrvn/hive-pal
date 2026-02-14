import { z } from 'zod';
import { FrameSize } from '../frame-sizes/frame-size.schema';

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

// Hive system variant groups - defines which variants are compatible
export const HIVE_SYSTEM_VARIANTS = {
  LANGSTROTH: [BoxVariantEnum.LANGSTROTH_DEEP, BoxVariantEnum.LANGSTROTH_SHALLOW],
  NATIONAL: [BoxVariantEnum.NATIONAL_DEEP, BoxVariantEnum.NATIONAL_SHALLOW],
  B_HIVE: [BoxVariantEnum.B_DEEP, BoxVariantEnum.B_SHALLOW],
  DADANT: [BoxVariantEnum.DADANT],
  WARRE: [BoxVariantEnum.WARRE],
  TOP_BAR: [BoxVariantEnum.TOP_BAR],
  CUSTOM: [BoxVariantEnum.CUSTOM],
} as const;

export type HiveSystem = keyof typeof HIVE_SYSTEM_VARIANTS;

/**
 * Get the hive system for a given box variant
 */
export function getHiveSystem(variant: BoxVariantEnum): HiveSystem {
  for (const [system, variants] of Object.entries(HIVE_SYSTEM_VARIANTS)) {
    if ((variants as readonly BoxVariantEnum[]).includes(variant)) {
      return system as HiveSystem;
    }
  }
  return 'CUSTOM';
}

/**
 * Get all compatible variants for a main box variant
 */
export function getCompatibleVariants(
  mainBoxVariant: BoxVariantEnum
): BoxVariantEnum[] {
  const system = getHiveSystem(mainBoxVariant);
  return [...HIVE_SYSTEM_VARIANTS[system]];
}

/**
 * Check if a variant is compatible with the main box variant.
 * CUSTOM is always compatible with any variant.
 */
export function isVariantCompatible(
  mainBoxVariant: BoxVariantEnum,
  boxVariant: BoxVariantEnum
): boolean {
  if (
    mainBoxVariant === BoxVariantEnum.CUSTOM ||
    boxVariant === BoxVariantEnum.CUSTOM
  )
    return true;
  const system = getHiveSystem(mainBoxVariant);
  return (HIVE_SYSTEM_VARIANTS[system] as readonly BoxVariantEnum[]).includes(
    boxVariant
  );
}

/**
 * Get an equivalent variant in a target system (preserves deep/shallow preference)
 */
export function getEquivalentVariant(
  currentVariant: BoxVariantEnum,
  targetSystem: HiveSystem
): BoxVariantEnum {
  const isDeep =
    currentVariant.includes('DEEP') ||
    [BoxVariantEnum.DADANT, BoxVariantEnum.WARRE, BoxVariantEnum.TOP_BAR].includes(
      currentVariant
    );

  const targetVariants = HIVE_SYSTEM_VARIANTS[targetSystem];

  if (isDeep) {
    return (
      targetVariants.find((v) => v.includes('DEEP')) || targetVariants[0]
    );
  }
  return targetVariants.find((v) => v.includes('SHALLOW')) || targetVariants[0];
}

/** Maps built-in frame size names to box variant */
export const FRAME_SIZE_VARIANT_MAP: Record<string, BoxVariantEnum> = {
  'Langstroth Deep': BoxVariantEnum.LANGSTROTH_DEEP,
  'Langstroth Medium': BoxVariantEnum.LANGSTROTH_SHALLOW,
  'Langstroth Shallow': BoxVariantEnum.LANGSTROTH_SHALLOW,
  Dadant: BoxVariantEnum.DADANT,
  'National Deep': BoxVariantEnum.NATIONAL_DEEP,
  'National Shallow': BoxVariantEnum.NATIONAL_SHALLOW,
  'Warré': BoxVariantEnum.WARRE,
  'Top Bar': BoxVariantEnum.TOP_BAR,
  'B Deep': BoxVariantEnum.B_DEEP,
  'B Shallow': BoxVariantEnum.B_SHALLOW,
};

/** Reverse map: variant to primary built-in frame size name */
export const VARIANT_FRAME_SIZE_MAP: Record<BoxVariantEnum, string> = {
  [BoxVariantEnum.LANGSTROTH_DEEP]: 'Langstroth Deep',
  [BoxVariantEnum.LANGSTROTH_SHALLOW]: 'Langstroth Shallow',
  [BoxVariantEnum.B_DEEP]: 'B Deep',
  [BoxVariantEnum.B_SHALLOW]: 'B Shallow',
  [BoxVariantEnum.DADANT]: 'Dadant',
  [BoxVariantEnum.NATIONAL_DEEP]: 'National Deep',
  [BoxVariantEnum.NATIONAL_SHALLOW]: 'National Shallow',
  [BoxVariantEnum.WARRE]: 'Warré',
  [BoxVariantEnum.TOP_BAR]: 'Top Bar',
  [BoxVariantEnum.CUSTOM]: '',
};

/** Get the variant for a frame size (CUSTOM for non-built-in) */
export function getVariantForFrameSize(frameSize: FrameSize): BoxVariantEnum {
  if (!frameSize.isBuiltIn) return BoxVariantEnum.CUSTOM;
  return FRAME_SIZE_VARIANT_MAP[frameSize.name] ?? BoxVariantEnum.CUSTOM;
}

/** Find the built-in frame size matching a variant */
export function findFrameSizeForVariant(
  frameSizes: FrameSize[],
  variant: BoxVariantEnum
): FrameSize | undefined {
  const name = VARIANT_FRAME_SIZE_MAP[variant];
  if (!name) return undefined;
  return frameSizes.find((fs) => fs.name === name && fs.isBuiltIn);
}

/** Get compatible frame sizes for a given main box frame size */
export function getCompatibleFrameSizes(
  allFrameSizes: FrameSize[],
  mainBoxFrameSize: FrameSize
): FrameSize[] {
  const mainVariant = getVariantForFrameSize(mainBoxFrameSize);
  const compatibleVariants = getCompatibleVariants(mainVariant);
  return allFrameSizes.filter((fs) => {
    const v = getVariantForFrameSize(fs);
    return v === BoxVariantEnum.CUSTOM || compatibleVariants.includes(v);
  });
}

export const boxTypeSchema = z.nativeEnum(BoxTypeEnum);
export const boxVariantSchema = z.nativeEnum(BoxVariantEnum);

// Hex color validation regex
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const boxSchema = z.object({
  id: z.string().uuid().optional(),
  position: z.number().int().min(0),
  frameCount: z.number().int().min(0),
  hasExcluder: z.boolean(),
  type: boxTypeSchema,
  maxFrameCount: z.number().int().min(1).optional(),
  variant: boxVariantSchema.optional(),
  frameSizeId: z.string().uuid().optional().nullable(),
  color: z.string().regex(hexColorRegex, 'Invalid hex color').optional(),
  winterized: z.boolean().default(false),
});

export const updateHiveBoxesSchema = z.object({
  boxes: z.array(boxSchema),
});

export type BoxType = z.infer<typeof boxTypeSchema>;
export type BoxVariant = z.infer<typeof boxVariantSchema>;
export type Box = z.infer<typeof boxSchema>;
export type UpdateHiveBoxes = z.infer<typeof updateHiveBoxesSchema>;
