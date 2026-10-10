import { create } from 'zustand';

export type ImageDisplayMode = 'banner' | 'side' | 'hidden';

const STORAGE_KEY = 'image-display-mode';
const MODES: ImageDisplayMode[] = ['banner', 'side', 'hidden'];

interface ImageDisplayState {
  mode: ImageDisplayMode;
  setMode: (mode: ImageDisplayMode) => void;
  cycleMode: () => void;
}

export const useImageDisplayStore = create<ImageDisplayState>(set => {
  // No storage while prerendering on the server.
  const stored =
    typeof localStorage === 'undefined'
      ? null
      : (localStorage.getItem(STORAGE_KEY) as ImageDisplayMode | null);
  const initial: ImageDisplayMode =
    stored && MODES.includes(stored) ? stored : 'side';

  return {
    mode: initial,
    setMode: (mode: ImageDisplayMode) => {
      localStorage.setItem(STORAGE_KEY, mode);
      set({ mode });
    },
    cycleMode: () => {
      set(state => {
        const nextIndex = (MODES.indexOf(state.mode) + 1) % MODES.length;
        const next = MODES[nextIndex];
        localStorage.setItem(STORAGE_KEY, next);
        return { mode: next };
      });
    },
  };
});
