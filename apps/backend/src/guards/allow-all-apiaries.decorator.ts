import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key marking a route handler as supporting the cross-apiary
 * "view all" mode (x-apiary-id: all).
 */
export const ALLOW_ALL_APIARIES_KEY = 'allowAllApiaries';

/**
 * Marks a GET route handler as safe to run in the cross-apiary "view all" mode.
 *
 * By default the ApiaryContextGuard rejects `x-apiary-id: all`, because most
 * services filter by a single `apiaryId` and would otherwise run unscoped
 * queries (leaking other users' data). Only handlers whose service explicitly
 * scopes the query to the user's apiaries when no single apiary is set should
 * opt in with this decorator.
 */
export const AllowAllApiaries = () => SetMetadata(ALLOW_ALL_APIARIES_KEY, true);
