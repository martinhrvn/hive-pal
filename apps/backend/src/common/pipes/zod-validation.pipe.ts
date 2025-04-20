import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

interface ZodIssue {
  path: (string | number)[];
  message: string;
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(
    private schema: ZodSchema,
    private type = 'body',
  ) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    try {
      // Type assertion to make TypeScript happy, while still preserving
      // the actual type checking done by the Zod schema.
      if (this.type === _metadata.type) {
        return this.schema.parse(value) as unknown;
      } else {
        return value;
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(
          (err: ZodIssue) => `${err.path.join('.')} - ${err.message}`,
        );
        throw new BadRequestException({
          message: `Validation failed ${details.join(', ')}`,
          errors: error.errors.map((err: ZodIssue) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
