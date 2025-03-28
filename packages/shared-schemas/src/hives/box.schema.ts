import { z } from 'zod';

export enum BoxTypeEnum {
  BROOD = 'BROOD',
  HONEY = 'HONEY',
  FEEDER = 'FEEDER',
}

export const boxTypeSchema = z.nativeEnum(BoxTypeEnum);

export const boxSchema = z.object({
  id: z.string().uuid().optional(),
  position: z.number().int().min(0),
  frameCount: z.number().int().min(1),
  hasExcluder: z.boolean(),
  type: boxTypeSchema,
  maxFrameCount: z.number().int().min(1).optional(),
});

export const updateHiveBoxesSchema = z.object({
  boxes: z.array(boxSchema),
});

export type BoxType = z.infer<typeof boxTypeSchema>;
export type Box = z.infer<typeof boxSchema>;
export type UpdateHiveBoxes = z.infer<typeof updateHiveBoxesSchema>;