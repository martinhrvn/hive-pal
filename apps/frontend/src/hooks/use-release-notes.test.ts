/**
 * Integration tests for use-release-notes hook using safeJsonParse
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useReleaseNotesStore } from './use-release-notes';

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
  let consoleSpy: {
    error: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    localStorageMock.clear();
    // Reset store to initial state
    useReleaseNotesStore.setState({
      dismissedReleases: [],
    });
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
    it('should return empty array when localStorage is empty', () => {
      const store = useReleaseNotesStore.getState();

      expect(store.dismissedReleases).toEqual([]);
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty array in localStorage', () => {
      localStorageMock.setItem('hivepal-dismissed-releases', '[]');

      const store = useReleaseNotesStore.getState();

      expect(store.dismissedReleases).toEqual([]);
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should handle null values in localStorage (should not log)', () => {
      // localStorage.getItem returns null when key doesn't exist
      const store = useReleaseNotesStore.getState();

      expect(store.dismissedReleases).toEqual([]);
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('saveDismissedReleases', () => {
    it('should save valid data to localStorage', () => {
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

      const store = useReleaseNotesStore.getState();

      // Should not throw, just log a warning
      expect(() => store.dismissRelease('1.0.0')).not.toThrow();

      // Restore
      localStorageMock.setItem = originalSetItem;
    });
  });
});
