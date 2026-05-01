/**
 * Integration tests for use-release-notes hook using safeJsonParse
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('use-release-notes integration with safeJsonParse', () => {
  let consoleSpy: { error: any; warn: any };

  beforeEach(() => {
    localStorageMock.clear();
    consoleSpy = {
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('loadDismissedReleases', () => {
    it('should load valid dismissed releases from localStorage', () => {
      const dismissedReleases = [
        { version: '1.0.0', dismissedAt: '2024-01-01T00:00:00Z' },
        { version: '2.0.0', dismissedAt: '2024-02-01T00:00:00Z' },
      ];

      localStorageMock.setItem(
        'hivepal-dismissed-releases',
        JSON.stringify(dismissedReleases)
      );

      // Re-import to trigger initial state
      const { useReleaseNotesStore } = require('./use-release-notes');
      const store = useReleaseNotesStore.getState();

      expect(store.dismissedReleases).toEqual(dismissedReleases);
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should return empty array when localStorage is empty', () => {
      const { useReleaseNotesStore } = require('./use-release-notes');
      const store = useReleaseNotesStore.getState();

      expect(store.dismissedReleases).toEqual([]);
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should handle corrupted JSON in localStorage gracefully', () => {
      localStorageMock.setItem('hivepal-dismissed-releases', 'invalid json {]');

      const { useReleaseNotesStore } = require('./use-release-notes');
      const store = useReleaseNotesStore.getState();

      // Should return empty array and log error
      expect(store.dismissedReleases).toEqual([]);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse JSON for "dismissed releases"'),
        expect.any(Object)
      );
    });

    it('should handle invalid schema in localStorage gracefully', () => {
      // Missing dismissedAt field
      const invalidData = [
        { version: '1.0.0' },
      ];

      localStorageMock.setItem(
        'hivepal-dismissed-releases',
        JSON.stringify(invalidData)
      );

      const { useReleaseNotesStore } = require('./use-release-notes');
      const store = useReleaseNotesStore.getState();

      // Should return empty array and log warning
      expect(store.dismissedReleases).toEqual([]);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Schema validation failed for "dismissed releases"'),
        expect.any(Object)
      );
    });

    it('should handle non-array data in localStorage', () => {
      localStorageMock.setItem(
        'hivepal-dismissed-releases',
        JSON.stringify({ version: '1.0.0' })
      );

      const { useReleaseNotesStore } = require('./use-release-notes');
      const store = useReleaseNotesStore.getState();

      expect(store.dismissedReleases).toEqual([]);
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should handle array with mixed valid and invalid items', () => {
      const mixedData = [
        { version: '1.0.0', dismissedAt: '2024-01-01T00:00:00Z' }, // valid
        { version: '2.0.0' }, // invalid - missing dismissedAt
      ];

      localStorageMock.setItem(
        'hivepal-dismissed-releases',
        JSON.stringify(mixedData)
      );

      const { useReleaseNotesStore } = require('./use-release-notes');
      const store = useReleaseNotesStore.getState();

      // Zod will reject the entire array if any item is invalid
      expect(store.dismissedReleases).toEqual([]);
      expect(consoleSpy.warn).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty array in localStorage', () => {
      localStorageMock.setItem('hivepal-dismissed-releases', '[]');

      const { useReleaseNotesStore } = require('./use-release-notes');
      const store = useReleaseNotesStore.getState();

      expect(store.dismissedReleases).toEqual([]);
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should handle version strings with special characters', () => {
      const dismissedReleases = [
        { version: '1.0.0-beta.1', dismissedAt: '2024-01-01T00:00:00Z' },
        { version: '2.0.0-rc.2+build.123', dismissedAt: '2024-02-01T00:00:00Z' },
      ];

      localStorageMock.setItem(
        'hivepal-dismissed-releases',
        JSON.stringify(dismissedReleases)
      );

      const { useReleaseNotesStore } = require('./use-release-notes');
      const store = useReleaseNotesStore.getState();

      expect(store.dismissedReleases).toEqual(dismissedReleases);
    });

    it('should handle very large version strings', () => {
      const dismissedReleases = [
        {
          version: 'v'.repeat(1000),
          dismissedAt: '2024-01-01T00:00:00Z',
        },
      ];

      localStorageMock.setItem(
        'hivepal-dismissed-releases',
        JSON.stringify(dismissedReleases)
      );

      const { useReleaseNotesStore } = require('./use-release-notes');
      const store = useReleaseNotesStore.getState();

      expect(store.dismissedReleases).toEqual(dismissedReleases);
    });

    it('should handle invalid date format in dismissedAt', () => {
      const dismissedReleases = [
        { version: '1.0.0', dismissedAt: 'not-a-date' },
      ];

      localStorageMock.setItem(
        'hivepal-dismissed-releases',
        JSON.stringify(dismissedReleases)
      );

      const { useReleaseNotesStore } = require('./use-release-notes');
      const store = useReleaseNotesStore.getState();

      // Schema allows any string for dismissedAt, so this should be valid
      expect(store.dismissedReleases).toEqual(dismissedReleases);
    });

    it('should handle null values in localStorage (should not log)', () => {
      // localStorage.getItem returns null when key doesn't exist
      const { useReleaseNotesStore } = require('./use-release-notes');
      const store = useReleaseNotesStore.getState();

      expect(store.dismissedReleases).toEqual([]);
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should handle Unicode characters in version strings', () => {
      const dismissedReleases = [
        { version: 'v1.0.0-🚀', dismissedAt: '2024-01-01T00:00:00Z' },
      ];

      localStorageMock.setItem(
        'hivepal-dismissed-releases',
        JSON.stringify(dismissedReleases)
      );

      const { useReleaseNotesStore } = require('./use-release-notes');
      const store = useReleaseNotesStore.getState();

      expect(store.dismissedReleases).toEqual(dismissedReleases);
    });
  });

  describe('saveDismissedReleases', () => {
    it('should save valid data to localStorage', () => {
      const { useReleaseNotesStore } = require('./use-release-notes');
      const store = useReleaseNotesStore.getState();

      store.dismissRelease('1.0.0');

      const stored = localStorageMock.getItem('hivepal-dismissed-releases');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].version).toBe('1.0.0');
      expect(parsed[0].dismissedAt).toBeTruthy();
    });

    it('should handle localStorage.setItem failure gracefully', () => {
      // Mock setItem to throw
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      const { useReleaseNotesStore } = require('./use-release-notes');
      const store = useReleaseNotesStore.getState();

      // Should not throw, just log a warning
      expect(() => store.dismissRelease('1.0.0')).not.toThrow();

      // Restore
      localStorageMock.setItem = originalSetItem;
    });
  });
});
