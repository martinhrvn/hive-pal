import { createHiveSchema } from 'validations';
import { createZodDto } from 'nestjs-zod';

export class CreateHiveDto extends createZodDto(createHiveSchema) {}
