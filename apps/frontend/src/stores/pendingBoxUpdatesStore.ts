import { create } from 'zustand';

/**
 * Represents a pending box update operation that failed during inspection save.
 * Used to track and retry failed box configuration updates.
 */
export interface PendingBoxUpdate {
  /** Unique identifier for the inspection (primary key) */
  inspectionId: string;

  /** The hive ID that the boxes belong to */
  hiveId: string;

  /**
   * The transformed box payload ready for API submission.
   * Temporary IDs (with 'temp-' prefix) are already stripped.
   */
  boxPayload: Array<{
    id?: string;
    type: string;
    frameCount: number;
  }>;

  /**
   * ISO timestamp of the hive's last modification time when the pending update was created.
   * Used for staleness detection during retry.
   */
  hiveLastModifiedAt: string;

  /**
   * ISO timestamp when this pending update was first recorded.
   * Auto-generated on creation.
   */
  attemptedAt: string;

  /**
   * Current status of the pending update.
   * 'in-progress': Box update is being attempted
   * 'failed': Box update failed and is waiting for retry or dismissal
   */
  status: 'in-progress' | 'failed';

  /**
   * Error message from the failed box update.
   * Only present when status is 'failed'.
   */
  error?: string;

  /**
   * Number of times this update has been retried.
   * Incremented on each retry attempt. Max limit is 5.
   */
  retryCount: number;
}

interface PendingBoxUpdatesStore {
  /** Map of pending updates, keyed by inspectionId */
  pendingUpdates: Map<string, PendingBoxUpdate>;

  /**
   * Add a new pending update to the store.
   * Auto-generates attemptedAt timestamp and initializes retryCount to 0.
   * If an update for the same inspectionId already exists, it is overwritten.
   */
  addPendingUpdate: (
    update: Omit<PendingBoxUpdate, 'attemptedAt' | 'retryCount'>,
  ) => void;

  /**
   * Update the status of an existing pending update.
   * Preserves all other fields. No-op if update doesn't exist.
   */
  updateStatus: (
    inspectionId: string,
    status: 'in-progress' | 'failed',
    error?: string,
  ) => void;

  /**
   * Increment the retry count of a pending update by 1.
   * No-op if update doesn't exist.
   */
  incrementRetryCount: (inspectionId: string) => void;

  /**
   * Remove a pending update from the store.
   * No-op if update doesn't exist.
   */
  removePendingUpdate: (inspectionId: string) => void;

  /**
   * Get a pending update by inspectionId.
   * Returns undefined if not found.
   */
  getPendingUpdate: (inspectionId: string) => PendingBoxUpdate | undefined;

  /**
   * Check if a pending update exists for the given inspectionId.
   */
  hasPendingUpdate: (inspectionId: string) => boolean;

  /**
   * Clear all pending updates from the store.
   * Used primarily for testing.
   */
  clear: () => void;
}

export const usePendingBoxUpdatesStore = create<PendingBoxUpdatesStore>(
  (set, get) => ({
    pendingUpdates: new Map(),

    addPendingUpdate: update =>
      set(state => {
        const newMap = new Map(state.pendingUpdates);
        newMap.set(update.inspectionId, {
          ...update,
          attemptedAt: new Date().toISOString(),
          retryCount: 0,
        });
        return { pendingUpdates: newMap };
      }),

    updateStatus: (inspectionId, status, error) =>
      set(state => {
        const existing = state.pendingUpdates.get(inspectionId);
        if (!existing) return state; // No-op if doesn't exist

        const newMap = new Map(state.pendingUpdates);
        newMap.set(inspectionId, {
          ...existing,
          status,
          error: status === 'failed' ? error : undefined, // Clear error when in-progress
        });
        return { pendingUpdates: newMap };
      }),

    incrementRetryCount: inspectionId =>
      set(state => {
        const existing = state.pendingUpdates.get(inspectionId);
        if (!existing) return state; // No-op if doesn't exist

        const newMap = new Map(state.pendingUpdates);
        newMap.set(inspectionId, {
          ...existing,
          retryCount: existing.retryCount + 1,
        });
        return { pendingUpdates: newMap };
      }),

    removePendingUpdate: inspectionId =>
      set(state => {
        if (!state.pendingUpdates.has(inspectionId)) return state; // No-op

        const newMap = new Map(state.pendingUpdates);
        newMap.delete(inspectionId);
        return { pendingUpdates: newMap };
      }),

    getPendingUpdate: inspectionId => {
      return get().pendingUpdates.get(inspectionId);
    },

    hasPendingUpdate: inspectionId => {
      return get().pendingUpdates.has(inspectionId);
    },

    clear: () => set({ pendingUpdates: new Map() }),
  }),
);
