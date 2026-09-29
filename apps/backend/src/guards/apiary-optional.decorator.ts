import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key marking a route handler as not requiring a concrete apiary.
 */
export const APIARY_OPTIONAL_KEY = 'apiaryOptional';

/**
 * Marks a route handler as working without a concrete `x-apiary-id`.
 *
 * - Reads scope to every apiary the user can access, narrowed to one apiary
 *   when the header (or `?apiaryId`) is present. See `apiaryReadScope`.
 * - Writes authorize at the resource level via `apiaryWriteScope`; the header
 *   is ignored, so a resource can be edited from any apiary context as long as
 *   the user can write to the apiary it belongs to. `ApiaryPermissionGuard`
 *   skips its header-role check for these handlers.
 *
 * Handlers WITHOUT this decorator keep the legacy contract: the header is
 * mandatory and is the authorization boundary. Only opt in once the service
 * behind the handler uses the scope helpers, otherwise a query that filters by
 * a single `apiaryId` would run unscoped.
 */
export const ApiaryOptional = () => SetMetadata(APIARY_OPTIONAL_KEY, true);
