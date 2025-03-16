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
      const { message: msg, ...meta } = message;
      return this.logger.info(msg || 'Object message', {
        context,
        ...meta,
      });
    }

    return this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string) {
    context = context || this.context;

    if (message instanceof Error) {
      trace = trace || message.stack;
      const { message: msg, name, stack, ...meta } = message;
      return this.logger.error(msg, {
        context,
        stack: trace,
        error_name: name,
        ...meta,
      });
    }

    if (message instanceof Object) {
      const { message: msg, ...meta } = message;
      return this.logger.error(msg || 'Object message', {
        context,
        stack: trace,
        ...meta,
      });
    }

    return this.logger.error(message, { context, stack: trace });
  }

  warn(message: any, context?: string) {
    context = context || this.context;

    if (message instanceof Object) {
      const { message: msg, ...meta } = message;
      return this.logger.warn(msg || 'Object message', {
        context,
        ...meta,
      });
    }

    return this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    context = context || this.context;

    if (message instanceof Object) {
      const { message: msg, ...meta } = message;
      return this.logger.debug(msg || 'Object message', {
        context,
        ...meta,
      });
    }

    return this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    context = context || this.context;

    if (message instanceof Object) {
      const { message: msg, ...meta } = message;
      return this.logger.verbose(msg || 'Object message', {
        context,
        ...meta,
      });
    }

    return this.logger.verbose(message, { context });
  }
}
