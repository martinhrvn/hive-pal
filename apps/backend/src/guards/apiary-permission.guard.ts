import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiaryRole } from '@/prisma/client';
import { APIARY_OPTIONAL_KEY } from './apiary-optional.decorator';

/**
 * Guard that enforces write permissions on apiary resources.
 * Must be used after ApiaryContextGuard which sets `request.apiaryRole`.
 *
 * VIEWER users are only allowed GET requests.
 * EDITOR and OWNER users are allowed all HTTP methods.
 *
 * Handlers decorated with `@ApiaryOptional()` are skipped: their services
 * authorize writes against the resource's own apiary (`apiaryWriteScope`),
 * so the role of the header apiary is not the right thing to check.
 */
@Injectable()
export class ApiaryPermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request: {
      method: string;
      apiaryRole?: ApiaryRole;
    } = context.switchToHttp().getRequest();

    const method = request.method.toUpperCase();

    // GET requests are allowed for all roles
    if (method === 'GET') {
      return true;
    }

    const apiaryOptional = this.reflector.getAllAndOverride<boolean>(
      APIARY_OPTIONAL_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (apiaryOptional) {
      return true;
    }

    // Mutation requests require a defined role of EDITOR or OWNER
    if (!request.apiaryRole) {
      throw new ForbiddenException('Missing apiary role for this operation');
    }

    if (request.apiaryRole === 'VIEWER') {
      throw new ForbiddenException('You have view-only access to this apiary');
    }

    return true;
  }
}
