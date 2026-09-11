import { Prisma } from '@/prisma/client';

/**
 * Prisma `ApiaryWhereInput` that matches every apiary a user can access
 * (owned or an active membership). Used to scope cross-apiary "view all"
 * queries to the current user's apiaries.
 */
export const apiaryAccessWhere = (userId: string): Prisma.ApiaryWhereInput => ({
  OR: [{ userId }, { members: { some: { userId, status: 'ACTIVE' } } }],
});
