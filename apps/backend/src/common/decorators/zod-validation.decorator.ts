import { ZodSchema } from 'zod';
import { applyDecorators, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

/**
 * Custom decorator that combines NestJS UsePipes with Swagger ApiBody
 * to provide both Zod validation and proper API documentation
 * @param schema Zod schema to validate against
 * @returns Decorator for controller method
 */
export function ZodValidation(schema: ZodSchema) {
  return applyDecorators(UsePipes(new ZodValidationPipe(schema)));
}
