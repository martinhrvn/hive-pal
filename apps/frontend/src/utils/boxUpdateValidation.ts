import { apiClient } from '@/api/client';
import type { PendingBoxUpdate } from '@/stores/pendingBoxUpdatesStore';
import type { HiveDetailResponse } from 'shared-schemas';

/**
 * Custom error type for stale payload detection.
 * Thrown when a pending box update's payload has become stale due to concurrent modifications.
 */
export class StalePayloadError extends Error {
  code = 'STALE_PAYLOAD' as const;

  constructor(message: string) {
    super(message);
    this.name = 'StalePayloadError';
  }
}

/**
 * Validates that a pending box update's payload is still fresh (not stale).
 *
 * A payload is considered stale if the hive's configuration has been modified
 * (updatedAt timestamp changed) since the pending update was created.
 *
 * This prevents applying outdated box configurations when concurrent modifications
 * have occurred, which would result in data loss or conflicting changes.
 *
 * @param pendingUpdate - The pending box update to validate
 * @throws {StalePayloadError} If the payload is stale (hive was modified after the pending update was created)
 *
 * @example
 * ```typescript
 * const pendingUpdate = store.getPendingUpdate(inspectionId);
 * try {
 *   await validatePayloadFreshness(pendingUpdate);
 *   // Payload is fresh, safe to retry
 *   await retryBoxUpdate(pendingUpdate);
 * } catch (error) {
 *   if (error instanceof StalePayloadError) {
 *     // Show staleness error message, disable retry permanently
 *   }
 * }
 * ```
 */
export async function validatePayloadFreshness(
  pendingUpdate: PendingBoxUpdate,
): Promise<void> {
  // Fetch current hive state to check if it has been modified
  const hiveResponse = await apiClient.get<HiveDetailResponse>(
    `/api/hives/${pendingUpdate.hiveId}`,
  );

  const currentHiveUpdatedAt = new Date(hiveResponse.data.updatedAt);
  const pendingUpdateTimestamp = new Date(pendingUpdate.hiveLastModifiedAt);

  // If current hive is newer than when the pending update was created,
  // the hive configuration has changed and the payload is stale
  if (currentHiveUpdatedAt > pendingUpdateTimestamp) {
    throw new StalePayloadError(
      'Hive box configuration has changed since this update failed. Please refresh the page to see current state, then manually apply your changes.',
    );
  }

  // Payload is fresh and safe to use
}
