import type { Request } from 'express';
import { ApiaryRole } from '@/prisma/client';

export interface RequestWithApiary extends Request {
  apiaryId: string;
  apiaryRole: ApiaryRole;
  user: {
    id: string;
  };
}

/**
 * Request type for read endpoints that support the "all apiaries" view mode.
 * When the client sends `x-apiary-id: all`, the ApiaryContextGuard leaves
 * `apiaryId` undefined and sets `allApiaries` to true, so the query is scoped
 * to every apiary the user owns or is an active member of.
 */
export interface RequestWithApiaryScope extends Request {
  apiaryId?: string;
  apiaryRole?: ApiaryRole;
  allApiaries?: boolean;
  user: {
    id: string;
  };
}

export interface ApiaryUserFilter {
  apiaryId: string;
  userId: string;
}

/**
 * Filter for read queries that may span all of a user's apiaries.
 * Either `apiaryId` is set (single apiary) or `allApiaries` is true (every
 * apiary the user has access to). `userId` is always required so the query
 * stays scoped to the current user.
 */
export interface ApiaryScopeFilter {
  apiaryId?: string;
  userId: string;
  allApiaries?: boolean;
}
