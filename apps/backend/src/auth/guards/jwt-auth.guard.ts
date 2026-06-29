import {
  Injectable,
  ExecutionContext,
  CanActivate,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../better-auth';

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export const ROLES_KEY = 'ROLES';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const JwtAuthGuard = AuthGuard;

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { session?: unknown; user?: unknown }>();
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers ?? {}),
      });
      request.session = session ?? null;
      request.user = session?.user ?? null;
    } catch {
      request.session = null;
      request.user = null;
    }
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() on the route — any authenticated user may pass.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // request.user is populated by JwtAuthGuard (better-auth AuthGuard), and
    // includes `role` via the customSession plugin. RolesGuard must run after it.
    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user?: { role?: Role } }>();

    if (!user || !user.role || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
