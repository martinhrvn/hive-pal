import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodError, ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(
    private schema: ZodType,
    private type = 'body',
  ) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    try {
      // Type assertion to make TypeScript happy, while still preserving
      // the actual type checking done by the Zod schema.
      if (this.type === _metadata.type) {
        return this.schema.parse(value);
      } else {
        return value;
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map(
          (err) => `${err.path.join('.')} - ${err.message}`,
        );
        throw new BadRequestException({
          message: `Validation failed ${details.join(', ')}`,
          errors: error.issues.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
