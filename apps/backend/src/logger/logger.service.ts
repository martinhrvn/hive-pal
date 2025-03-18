import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLoggerService implements LoggerService {
  private context?: string;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    context = context || this.context;

    if (message instanceof Object) {
      const { message: msg, ...meta } = message as { message?: string };
      return this.logger.info(msg || 'Object message', {
        context,
        ...meta,
      });
    }

    return this.logger.info(String(message), { context });
  }

  error(message: any, trace?: string, context?: string) {
    context = context || this.context;

    if (message instanceof Error) {
      trace = trace || message.stack;
      const { message: msg, name, ...meta } = message;
      return this.logger.error(String(msg), {
        context,
        stack: trace,
        error_name: name,
        ...meta,
      });
    }

    if (message instanceof Object) {
      const { message: msg, ...meta } = message as { message?: string };
      return this.logger.error(String(msg || 'Object message'), {
        context,
        stack: trace,
        ...meta,
      });
    }

    return this.logger.error(String(message), { context, stack: trace });
  }

  warn(message: any, context?: string) {
    context = context || this.context;

    if (message instanceof Object) {
      const { message: msg, ...meta } = message as { message?: string };
      return this.logger.warn(String(msg || 'Object message'), {
        context,
        ...meta,
      });
    }

    return this.logger.warn(String(message), { context });
  }

  debug(message: any, context?: string) {
    context = context || this.context;

    if (message instanceof Object) {
      const { message: msg, ...meta } = message as { message?: string };
      return this.logger.debug(String(msg || 'Object message'), {
        context,
        ...meta,
      });
    }

    return this.logger.debug(String(message), { context });
  }

  verbose(message: any, context?: string) {
    context = context || this.context;

    if (message instanceof Object) {
      const { message: msg, ...meta } = message as { message?: string };
      return this.logger.verbose(String(msg || 'Object message'), {
        context,
        ...meta,
      });
    }

    return this.logger.verbose(String(message), { context });
  }
}
