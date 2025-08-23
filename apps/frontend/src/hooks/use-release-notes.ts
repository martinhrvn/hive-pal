import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { DismissedRelease, ParsedReleaseNote } from '@/types/release-notes';
import { loadAllReleaseNotes, compareVersions } from '@/utils/release-notes';

const RELEASE_NOTES_STORAGE_KEY = 'hivepal-dismissed-releases';

interface ReleaseNotesState {
  releaseNotes: ParsedReleaseNote[];
  dismissedReleases: DismissedRelease[];
  isLoaded: boolean;
  isLoading: boolean;
  loadReleaseNotes: () => Promise<void>;
  dismissRelease: (version: string) => void;
  isReleaseDismissed: (version: string) => boolean;
  getLatestUndismissedRelease: () => ParsedReleaseNote | null;
}

const loadDismissedReleases = (): DismissedRelease[] => {
  try {
    const stored = localStorage.getItem(RELEASE_NOTES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load dismissed releases from localStorage:', error);
  }
  return [];
};

const saveDismissedReleases = (dismissed: DismissedRelease[]): void => {
  try {
    localStorage.setItem(RELEASE_NOTES_STORAGE_KEY, JSON.stringify(dismissed));
  } catch (error) {
    console.warn('Failed to save dismissed releases to localStorage:', error);
  }
};

export const useReleaseNotesStore = create<ReleaseNotesState>((set, get) => ({
  releaseNotes: [],
  dismissedReleases: loadDismissedReleases(),
  isLoaded: false,
  isLoading: false,

  loadReleaseNotes: async () => {
    const { isLoaded, isLoading } = get();
    if (isLoaded || isLoading) return;

    set({ isLoading: true });

    try {
      const notes = await loadAllReleaseNotes();
      set({
        releaseNotes: notes,
        isLoaded: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load release notes:', error);
      set({ isLoading: false });
    }
  },

  dismissRelease: (version: string) => {
    const { dismissedReleases } = get();
    const newDismissed: DismissedRelease = {
      version,
      dismissedAt: new Date().toISOString(),
    };

    const updated = [
      ...dismissedReleases.filter(d => d.version !== version),
      newDismissed,
    ];
    saveDismissedReleases(updated);
    set({ dismissedReleases: updated });
  },

  isReleaseDismissed: (version: string) => {
    const { dismissedReleases } = get();
    return dismissedReleases.some(d => d.version === version);
  },

  getLatestUndismissedRelease: () => {
    const { releaseNotes, dismissedReleases } = get();

    if (releaseNotes.length === 0) return null;

    // Find the highest dismissed version
    const dismissedVersions = dismissedReleases.map(d => d.version);
    
    if (dismissedVersions.length === 0) {
      // No versions dismissed, show the latest release
      return releaseNotes[0];
    }

    // Find the highest dismissed version
    const highestDismissedVersion = dismissedVersions.reduce((highest, current) => {
      return compareVersions(current, highest) > 0 ? current : highest;
    });

    // Only show releases that are newer than the highest dismissed version
    const newerReleases = releaseNotes.filter(release => {
      return compareVersions(release.version, highestDismissedVersion) > 0;
    });

    if (newerReleases.length === 0) return null;

    // Return the latest newer release
    return newerReleases[0];
  },
}));

export const useReleaseNotes = () => {
  return useReleaseNotesStore(
    useShallow(state => ({
      releaseNotes: state.releaseNotes,
      isLoaded: state.isLoaded,
      isLoading: state.isLoading,
      loadReleaseNotes: state.loadReleaseNotes,
      dismissRelease: state.dismissRelease,
      isReleaseDismissed: state.isReleaseDismissed,
      getLatestUndismissedRelease: state.getLatestUndismissedRelease,
    })),
  );
};
