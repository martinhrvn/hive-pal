import { z } from 'zod';
import { updateHiveSchema } from 'validations';

export type UpdateHiveDto = z.infer<typeof updateHiveSchema>;
