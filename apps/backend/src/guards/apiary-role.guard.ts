import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiaryMemberRole } from '@/prisma/client';
import { APIARY_ROLE_KEY } from './decorators/require-apiary-role.decorator';

const ROLE_HIERARCHY: Record<ApiaryMemberRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  OWNER: 2,
};

@Injectable()
export class ApiaryRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.getAllAndOverride<ApiaryMemberRole>(
      APIARY_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No role requirement set — allow any member (VIEWER+)
    if (!requiredRole) return true;

    const req: { apiaryRole?: ApiaryMemberRole } = context
      .switchToHttp()
      .getRequest();

    if (!req.apiaryRole) {
      throw new ForbiddenException('Apiary role not resolved');
    }

    const hasPermission =
      ROLE_HIERARCHY[req.apiaryRole] >= ROLE_HIERARCHY[requiredRole];

    if (!hasPermission) {
      throw new ForbiddenException(
        `This action requires ${requiredRole} role or higher`,
      );
    }

    return true;
  }
}
