import { Prisma } from '@/prisma/client';
import { ApiaryScopeFilter } from '../interface/request-with.apiary';

/**
 * Prisma `ApiaryWhereInput` that matches every apiary a user can access
 * (owned or an active membership). Used to scope cross-apiary "view all"
 * queries to the current user's apiaries.
 */
export const apiaryAccessWhere = (userId: string): Prisma.ApiaryWhereInput => ({
  OR: [{ userId }, { members: { some: { userId, status: 'ACTIVE' } } }],
});

/**
 * Prisma `ApiaryWhereInput` that matches every apiary the user may WRITE to:
 * owned, or an active membership with the OWNER or EDITOR role. VIEWER
 * memberships are excluded.
 */
export const apiaryWriteAccessWhere = (
  userId: string,
): Prisma.ApiaryWhereInput => ({
  OR: [
    { userId },
    {
      members: {
        some: { userId, status: 'ACTIVE', role: { in: ['OWNER', 'EDITOR'] } },
      },
    },
  ],
});

/**
 * Read scope for handlers decorated with `@ApiaryOptional()`.
 *
 * The `x-apiary-id` header is a filter only: when present the query is
 * narrowed to that apiary, otherwise it spans every apiary the user can
 * access. Access is always enforced by `apiaryAccessWhere`.
 */
export const apiaryReadScope = (
  filter: ApiaryScopeFilter,
): Prisma.ApiaryWhereInput =>
  filter.apiaryId
    ? { id: filter.apiaryId, ...apiaryAccessWhere(filter.userId) }
    : apiaryAccessWhere(filter.userId);

/**
 * Write scope for handlers decorated with `@ApiaryOptional()`.
 *
 * Writes authorize against the resource's OWN apiary, so the header is
 * deliberately ignored: a resource may be edited from any apiary context as
 * long as the user can write to the apiary it belongs to.
 */
export const apiaryWriteScope = (
  filter: ApiaryScopeFilter,
): Prisma.ApiaryWhereInput => apiaryWriteAccessWhere(filter.userId);
