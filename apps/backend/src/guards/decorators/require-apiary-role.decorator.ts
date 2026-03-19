import { SetMetadata } from '@nestjs/common';
import { ApiaryMemberRole } from '@/prisma/client';

export const APIARY_ROLE_KEY = 'apiaryRole';

/**
 * Decorator that sets the minimum ApiaryMemberRole required to access a route.
 * Must be used alongside ApiaryContextGuard (which populates req.apiaryRole)
 * and ApiaryRoleGuard (which enforces this decorator).
 *
 * Role hierarchy: OWNER > EDITOR > VIEWER
 */
export const RequireApiaryRole = (role: ApiaryMemberRole) =>
  SetMetadata(APIARY_ROLE_KEY, role);
