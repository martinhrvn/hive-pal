import { HiveStatus } from "database";
import { z } from "zod";

export const createHiveSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  apiaryId: z.string().uuid().nullish(),
  status: z.nativeEnum(HiveStatus),
  description: z.string().nullish(),
});
