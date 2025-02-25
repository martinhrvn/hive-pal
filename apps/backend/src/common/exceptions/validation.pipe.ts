// eslint-disable
import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe<T extends ZodSchema> implements PipeTransform {
  constructor(private schema: T) {}

  transform(value: unknown) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return this.schema.parse(value);
    } catch (e) {
      console.error('Error validating request', e);
      throw new BadRequestException('Validation failed');
    }
  }
}
