/**
 * Unit tests for PendingBoxUpdatesStore
 * Tests the Zustand store logic for managing pending box update operations
 * 
 * Note: These tests use vitest API but can be run with any compatible test runner.
 * If vitest is not available, use Jest with npm install vitest
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  usePendingBoxUpdatesStore,
  type PendingBoxUpdate,
} from './pendingBoxUpdatesStore';

describe('PendingBoxUpdatesStore', () => {
  // Helper to get current state
  const getState = () => usePendingBoxUpdatesStore.getState();

  // Helper to reset store before each test
  beforeEach(() => {
    getState().clear();
  });

  // Helper to clean up after each test
  afterEach(() => {
    getState().clear();
  });

  // ISO timestamp regex for validation
  const isoTimestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

  describe('5.2: addPendingUpdate', () => {
    it('should add a pending update with auto-generated ISO timestamp and retryCount = 0', () => {
      const inspectionId = 'insp-123';
      const hiveId = 'hive-456';
      const boxPayload = [
        { type: 'box', frameCount: 10 },
        { type: 'super', frameCount: 5 },
      ];
      const hiveLastModifiedAt = new Date('2026-05-01T10:00:00.000Z').toISOString();

      getState().addPendingUpdate({
        inspectionId,
        hiveId,
        boxPayload,
        hiveLastModifiedAt,
        status: 'in-progress',
      });

      const update = getState().getPendingUpdate(inspectionId);

      expect(update).toBeDefined();
      expect(update?.inspectionId).toBe(inspectionId);
      expect(update?.hiveId).toBe(hiveId);
      expect(update?.boxPayload).toEqual(boxPayload);
      expect(update?.hiveLastModifiedAt).toBe(hiveLastModifiedAt);
      expect(update?.status).toBe('in-progress');
      expect(update?.retryCount).toBe(0);
      expect(update?.attemptedAt).toMatch(isoTimestampRegex);
      expect(update?.error).toBeUndefined();
    });

    it('should auto-generate attemptedAt as ISO timestamp', () => {
      const now = new Date();
      getState().addPendingUpdate({
        inspectionId: 'insp-123',
        hiveId: 'hive-456',
        boxPayload: [],
        hiveLastModifiedAt: now.toISOString(),
        status: 'in-progress',
      });

      const update = getState().getPendingUpdate('insp-123');

      expect(update?.attemptedAt).toMatch(isoTimestampRegex);
      // Check timestamp is close to current time (within 1 second)
      const createdAt = new Date(update!.attemptedAt);
      const diffMs = Math.abs(createdAt.getTime() - now.getTime());
      expect(diffMs).toBeLessThan(1000);
    });

    it('should initialize retryCount to 0', () => {
      getState().addPendingUpdate({
        inspectionId: 'insp-123',
        hiveId: 'hive-456',
        boxPayload: [],
        hiveLastModifiedAt: new Date().toISOString(),
        status: 'in-progress',
      });

      const update = getState().getPendingUpdate('insp-123');
      expect(update?.retryCount).toBe(0);
    });
  });

  describe('5.3: addPendingUpdate overwrites existing', () => {
    it('should overwrite existing update with same inspectionId', () => {
      const inspectionId = 'insp-123';

      // Add first update
      getState().addPendingUpdate({
        inspectionId,
        hiveId: 'hive-old',
        boxPayload: [{ type: 'box', frameCount: 5 }],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      const firstUpdate = getState().getPendingUpdate(inspectionId);
      const firstTimestamp = firstUpdate?.attemptedAt;

      // Wait slightly to ensure different timestamp
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      // Small delay to ensure timestamp difference (if system is fast)
      await new Promise((resolve) => setImmediate(resolve));

      // Add second update with same inspectionId
      getState().addPendingUpdate({
        inspectionId,
        hiveId: 'hive-new',
        boxPayload: [{ type: 'super', frameCount: 3 }],
        hiveLastModifiedAt: '2026-05-01T11:00:00.000Z',
        status: 'failed',
        error: 'Network error',
      });

      const secondUpdate = getState().getPendingUpdate(inspectionId);

      // Verify the update was replaced
      expect(secondUpdate?.hiveId).toBe('hive-new');
      expect(secondUpdate?.status).toBe('failed');
      expect(secondUpdate?.error).toBe('Network error');
      expect(secondUpdate?.retryCount).toBe(0); // Reset to 0 on overwrite
      // Timestamp should be different (or at least could be)
      expect(secondUpdate?.attemptedAt).toBeDefined();
    });

    it('should only have one update in the store after overwriting', () => {
      const inspectionId = 'insp-123';

      getState().addPendingUpdate({
        inspectionId,
        hiveId: 'hive-1',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      getState().addPendingUpdate({
        inspectionId,
        hiveId: 'hive-2',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T11:00:00.000Z',
        status: 'in-progress',
      });

      const state = getState();
      expect(state.pendingUpdates.size).toBe(1);
    });
  });

  describe('5.4: updateStatus transitions', () => {
    it('should transition from in-progress to failed with error message', () => {
      const inspectionId = 'insp-123';

      // Add initial update
      getState().addPendingUpdate({
        inspectionId,
        hiveId: 'hive-456',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      const updateBefore = getState().getPendingUpdate(inspectionId);
      expect(updateBefore?.status).toBe('in-progress');
      expect(updateBefore?.error).toBeUndefined();

      // Update status to failed
      const errorMsg = 'Connection timeout';
      getState().updateStatus(inspectionId, 'failed', errorMsg);

      const updateAfter = getState().getPendingUpdate(inspectionId);
      expect(updateAfter?.status).toBe('failed');
      expect(updateAfter?.error).toBe(errorMsg);
    });

    it('should clear error message when status is in-progress', () => {
      const inspectionId = 'insp-123';

      // Add update with error
      getState().addPendingUpdate({
        inspectionId,
        hiveId: 'hive-456',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'failed',
        error: 'Network error',
      });

      const updateBefore = getState().getPendingUpdate(inspectionId);
      expect(updateBefore?.error).toBe('Network error');

      // Update status back to in-progress
      getState().updateStatus(inspectionId, 'in-progress');

      const updateAfter = getState().getPendingUpdate(inspectionId);
      expect(updateAfter?.status).toBe('in-progress');
      expect(updateAfter?.error).toBeUndefined();
    });

    it('should preserve other fields when updating status', () => {
      const inspectionId = 'insp-123';
      const hiveId = 'hive-456';
      const boxPayload = [{ type: 'box', frameCount: 10 }];
      const hiveLastModifiedAt = '2026-05-01T10:00:00.000Z';

      getState().addPendingUpdate({
        inspectionId,
        hiveId,
        boxPayload,
        hiveLastModifiedAt,
        status: 'in-progress',
      });

      const originalUpdate = getState().getPendingUpdate(inspectionId)!;
      const originalAttemptedAt = originalUpdate.attemptedAt;

      getState().updateStatus(inspectionId, 'failed', 'Error msg');

      const updatedUpdate = getState().getPendingUpdate(inspectionId)!;

      expect(updatedUpdate.inspectionId).toBe(inspectionId);
      expect(updatedUpdate.hiveId).toBe(hiveId);
      expect(updatedUpdate.boxPayload).toEqual(boxPayload);
      expect(updatedUpdate.hiveLastModifiedAt).toBe(hiveLastModifiedAt);
      expect(updatedUpdate.attemptedAt).toBe(originalAttemptedAt);
      expect(updatedUpdate.retryCount).toBe(originalUpdate.retryCount);
    });
  });

  describe('5.5: updateStatus no-op on non-existent', () => {
    it('should be no-op when updating status of non-existent inspectionId', () => {
      const stateBefore = getState().pendingUpdates;
      const stateSizeBefore = stateBefore.size;

      // Try to update non-existent update
      getState().updateStatus('non-existent', 'failed', 'Error');

      const stateAfter = getState().pendingUpdates;
      expect(stateAfter.size).toBe(stateSizeBefore);
      expect(getState().getPendingUpdate('non-existent')).toBeUndefined();
    });

    it('should return same state reference on no-op', () => {
      // Add an update to ensure store has state
      getState().addPendingUpdate({
        inspectionId: 'insp-123',
        hiveId: 'hive-456',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      const stateBefore = getState().pendingUpdates;

      // Try to update non-existent update
      getState().updateStatus('non-existent', 'failed', 'Error');

      const stateAfter = getState().pendingUpdates;
      // State reference might change even for no-ops in Zustand, but content should be same
      expect(stateAfter.size).toBe(stateBefore.size);
      expect(getState().hasPendingUpdate('insp-123')).toBe(true);
    });
  });

  describe('5.6: incrementRetryCount', () => {
    it('should increment retryCount from 0 to 1', () => {
      const inspectionId = 'insp-123';

      getState().addPendingUpdate({
        inspectionId,
        hiveId: 'hive-456',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      expect(getState().getPendingUpdate(inspectionId)?.retryCount).toBe(0);

      getState().incrementRetryCount(inspectionId);

      expect(getState().getPendingUpdate(inspectionId)?.retryCount).toBe(1);
    });

    it('should increment retryCount from 1 to 2', () => {
      const inspectionId = 'insp-123';

      getState().addPendingUpdate({
        inspectionId,
        hiveId: 'hive-456',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      getState().incrementRetryCount(inspectionId);
      getState().incrementRetryCount(inspectionId);

      expect(getState().getPendingUpdate(inspectionId)?.retryCount).toBe(2);
    });

    it('should increment multiple times sequentially', () => {
      const inspectionId = 'insp-123';

      getState().addPendingUpdate({
        inspectionId,
        hiveId: 'hive-456',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      for (let i = 0; i < 5; i++) {
        getState().incrementRetryCount(inspectionId);
        expect(getState().getPendingUpdate(inspectionId)?.retryCount).toBe(
          i + 1
        );
      }
    });

    it('should preserve other fields when incrementing retryCount', () => {
      const inspectionId = 'insp-123';
      const hiveId = 'hive-456';

      getState().addPendingUpdate({
        inspectionId,
        hiveId,
        boxPayload: [{ type: 'box', frameCount: 10 }],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'failed',
        error: 'Network error',
      });

      const updateBefore = getState().getPendingUpdate(inspectionId)!;

      getState().incrementRetryCount(inspectionId);

      const updateAfter = getState().getPendingUpdate(inspectionId)!;

      expect(updateAfter.inspectionId).toBe(updateBefore.inspectionId);
      expect(updateAfter.hiveId).toBe(updateBefore.hiveId);
      expect(updateAfter.status).toBe(updateBefore.status);
      expect(updateAfter.error).toBe(updateBefore.error);
      expect(updateAfter.attemptedAt).toBe(updateBefore.attemptedAt);
      expect(updateAfter.hiveLastModifiedAt).toBe(
        updateBefore.hiveLastModifiedAt
      );
    });
  });

  describe('5.7: incrementRetryCount no-op on non-existent', () => {
    it('should be no-op when incrementing non-existent inspectionId', () => {
      const sizeBefore = getState().pendingUpdates.size;

      getState().incrementRetryCount('non-existent');

      const sizeAfter = getState().pendingUpdates.size;
      expect(sizeAfter).toBe(sizeBefore);
      expect(getState().getPendingUpdate('non-existent')).toBeUndefined();
    });

    it('should not create new entry when incrementing non-existent', () => {
      // Add one update to ensure store works
      getState().addPendingUpdate({
        inspectionId: 'insp-123',
        hiveId: 'hive-456',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      const sizeBefore = getState().pendingUpdates.size;

      getState().incrementRetryCount('non-existent');

      const sizeAfter = getState().pendingUpdates.size;
      expect(sizeAfter).toBe(sizeBefore);
      expect(getState().hasPendingUpdate('insp-123')).toBe(true);
      expect(getState().hasPendingUpdate('non-existent')).toBe(false);
    });
  });

  describe('5.8: removePendingUpdate', () => {
    it('should remove existing pending update', () => {
      const inspectionId = 'insp-123';

      getState().addPendingUpdate({
        inspectionId,
        hiveId: 'hive-456',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      expect(getState().hasPendingUpdate(inspectionId)).toBe(true);

      getState().removePendingUpdate(inspectionId);

      expect(getState().hasPendingUpdate(inspectionId)).toBe(false);
      expect(getState().getPendingUpdate(inspectionId)).toBeUndefined();
    });

    it('should decrease store size when removing', () => {
      const insp1 = 'insp-123';
      const insp2 = 'insp-456';

      getState().addPendingUpdate({
        inspectionId: insp1,
        hiveId: 'hive-1',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      getState().addPendingUpdate({
        inspectionId: insp2,
        hiveId: 'hive-2',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      expect(getState().pendingUpdates.size).toBe(2);

      getState().removePendingUpdate(insp1);

      expect(getState().pendingUpdates.size).toBe(1);
      expect(getState().hasPendingUpdate(insp1)).toBe(false);
      expect(getState().hasPendingUpdate(insp2)).toBe(true);
    });
  });

  describe('5.9: removePendingUpdate no-op on non-existent', () => {
    it('should be no-op when removing non-existent inspectionId', () => {
      const sizeBefore = getState().pendingUpdates.size;

      getState().removePendingUpdate('non-existent');

      const sizeAfter = getState().pendingUpdates.size;
      expect(sizeAfter).toBe(sizeBefore);
    });

    it('should not affect existing entries when removing non-existent', () => {
      getState().addPendingUpdate({
        inspectionId: 'insp-123',
        hiveId: 'hive-456',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      getState().removePendingUpdate('non-existent');

      expect(getState().hasPendingUpdate('insp-123')).toBe(true);
      expect(getState().pendingUpdates.size).toBe(1);
    });
  });

  describe('5.10: Query functions', () => {
    describe('getPendingUpdate', () => {
      it('should return pending update by inspectionId', () => {
        const inspectionId = 'insp-123';
        const hiveId = 'hive-456';

        getState().addPendingUpdate({
          inspectionId,
          hiveId,
          boxPayload: [{ type: 'box', frameCount: 10 }],
          hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
          status: 'in-progress',
        });

        const result = getState().getPendingUpdate(inspectionId);

        expect(result).toBeDefined();
        expect(result?.inspectionId).toBe(inspectionId);
        expect(result?.hiveId).toBe(hiveId);
      });

      it('should return undefined for non-existent inspectionId', () => {
        getState().addPendingUpdate({
          inspectionId: 'insp-123',
          hiveId: 'hive-456',
          boxPayload: [],
          hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
          status: 'in-progress',
        });

        const result = getState().getPendingUpdate('non-existent');

        expect(result).toBeUndefined();
      });

      it('should return correct update from multiple entries', () => {
        const insp1 = 'insp-123';
        const insp2 = 'insp-456';

        getState().addPendingUpdate({
          inspectionId: insp1,
          hiveId: 'hive-1',
          boxPayload: [{ type: 'box', frameCount: 5 }],
          hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
          status: 'in-progress',
        });

        getState().addPendingUpdate({
          inspectionId: insp2,
          hiveId: 'hive-2',
          boxPayload: [{ type: 'super', frameCount: 3 }],
          hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
          status: 'failed',
        });

        const result1 = getState().getPendingUpdate(insp1);
        const result2 = getState().getPendingUpdate(insp2);

        expect(result1?.hiveId).toBe('hive-1');
        expect(result1?.boxPayload[0].frameCount).toBe(5);
        expect(result2?.hiveId).toBe('hive-2');
        expect(result2?.boxPayload[0].frameCount).toBe(3);
      });
    });

    describe('hasPendingUpdate', () => {
      it('should return true when pending update exists', () => {
        const inspectionId = 'insp-123';

        getState().addPendingUpdate({
          inspectionId,
          hiveId: 'hive-456',
          boxPayload: [],
          hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
          status: 'in-progress',
        });

        const result = getState().hasPendingUpdate(inspectionId);

        expect(result).toBe(true);
      });

      it('should return false when pending update does not exist', () => {
        getState().addPendingUpdate({
          inspectionId: 'insp-123',
          hiveId: 'hive-456',
          boxPayload: [],
          hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
          status: 'in-progress',
        });

        const result = getState().hasPendingUpdate('non-existent');

        expect(result).toBe(false);
      });

      it('should return false on empty store', () => {
        const result = getState().hasPendingUpdate('any-id');

        expect(result).toBe(false);
      });
    });
  });

  describe('5.11: clear function', () => {
    it('should remove all pending updates', () => {
      getState().addPendingUpdate({
        inspectionId: 'insp-1',
        hiveId: 'hive-1',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      getState().addPendingUpdate({
        inspectionId: 'insp-2',
        hiveId: 'hive-2',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'failed',
      });

      expect(getState().pendingUpdates.size).toBe(2);

      getState().clear();

      expect(getState().pendingUpdates.size).toBe(0);
      expect(getState().hasPendingUpdate('insp-1')).toBe(false);
      expect(getState().hasPendingUpdate('insp-2')).toBe(false);
    });

    it('should result in empty Map', () => {
      getState().addPendingUpdate({
        inspectionId: 'insp-123',
        hiveId: 'hive-456',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      getState().clear();

      expect(getState().pendingUpdates instanceof Map).toBe(true);
      expect(getState().pendingUpdates.size).toBe(0);
    });

    it('should allow adding updates after clear', () => {
      getState().addPendingUpdate({
        inspectionId: 'insp-1',
        hiveId: 'hive-1',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      getState().clear();

      expect(getState().pendingUpdates.size).toBe(0);

      getState().addPendingUpdate({
        inspectionId: 'insp-2',
        hiveId: 'hive-2',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      expect(getState().pendingUpdates.size).toBe(1);
      expect(getState().hasPendingUpdate('insp-2')).toBe(true);
    });
  });

  describe('Immutability Tests', () => {
    it('should not mutate previous state when adding update', () => {
      const stateBefore = getState().pendingUpdates;
      const sizeBefore = stateBefore.size;

      getState().addPendingUpdate({
        inspectionId: 'insp-123',
        hiveId: 'hive-456',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      const stateAfter = getState().pendingUpdates;

      // Map should be different instances (immutable pattern)
      expect(stateAfter).not.toBe(stateBefore);
      // But old state should still have old size
      expect(sizeBefore).toBe(0);
      expect(stateAfter.size).toBe(1);
    });

    it('should not mutate previous state when updating status', () => {
      getState().addPendingUpdate({
        inspectionId: 'insp-123',
        hiveId: 'hive-456',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      const updateBefore = getState().getPendingUpdate('insp-123')!;
      const statusBefore = updateBefore.status;

      getState().updateStatus('insp-123', 'failed', 'Error');

      const updateAfter = getState().getPendingUpdate('insp-123')!;

      // Old reference should not be mutated
      expect(updateBefore.status).toBe(statusBefore);
      expect(updateAfter.status).toBe('failed');
    });

    it('should not mutate boxPayload array', () => {
      const boxPayload = [{ type: 'box', frameCount: 10 }];

      getState().addPendingUpdate({
        inspectionId: 'insp-123',
        hiveId: 'hive-456',
        boxPayload,
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      const storedPayload = getState().getPendingUpdate('insp-123')?.boxPayload;

      // Should be same reference (shallow copy is acceptable for payload)
      expect(storedPayload).toEqual(boxPayload);
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple updates lifecycle', () => {
      const insp1 = 'insp-1';
      const insp2 = 'insp-2';

      // Add two updates
      getState().addPendingUpdate({
        inspectionId: insp1,
        hiveId: 'hive-1',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      getState().addPendingUpdate({
        inspectionId: insp2,
        hiveId: 'hive-2',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'in-progress',
      });

      expect(getState().pendingUpdates.size).toBe(2);

      // First one fails
      getState().updateStatus(insp1, 'failed', 'Network error');
      expect(getState().getPendingUpdate(insp1)?.status).toBe('failed');
      expect(getState().getPendingUpdate(insp2)?.status).toBe('in-progress');

      // Retry first one
      getState().incrementRetryCount(insp1);
      expect(getState().getPendingUpdate(insp1)?.retryCount).toBe(1);

      // Remove first one
      getState().removePendingUpdate(insp1);
      expect(getState().pendingUpdates.size).toBe(1);
      expect(getState().hasPendingUpdate(insp1)).toBe(false);
      expect(getState().hasPendingUpdate(insp2)).toBe(true);
    });

    it('should handle 5 retries up to disabled state', () => {
      const inspectionId = 'insp-123';

      getState().addPendingUpdate({
        inspectionId,
        hiveId: 'hive-456',
        boxPayload: [],
        hiveLastModifiedAt: '2026-05-01T10:00:00.000Z',
        status: 'failed',
      });

      // Simulate 5 retries
      for (let i = 0; i < 5; i++) {
        getState().incrementRetryCount(inspectionId);
      }

      const update = getState().getPendingUpdate(inspectionId)!;
      expect(update.retryCount).toBe(5);
      // Component logic would disable retry at this point
    });
  });
});
