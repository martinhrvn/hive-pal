import {
  Injectable,
  ExecutionContext,
  CanActivate,
  SetMetadata,
} from '@nestjs/common';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../better-auth';

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export const Roles = (...roles: Role[]) => SetMetadata('ROLES', roles);

export const JwtAuthGuard = AuthGuard;

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
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
  canActivate(): boolean {
    return true;
  }
}
