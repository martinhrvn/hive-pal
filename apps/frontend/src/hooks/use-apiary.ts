import { useEffect } from 'react';
import { APIARY_SELECTION, VIEW_ALL_APIARIES } from '@/context/auth-context';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useApiaries } from '@/api/hooks';
import { ApiaryResponse } from 'shared-schemas';

interface ApiaryState {
  activeApiaryId: string | null;
  // When true, the app shows data across ALL of the user's apiaries instead of
  // filtering to a single one. The concrete activeApiaryId is still kept around
  // as the default write target (creating hives etc. needs a target apiary).
  viewAllApiaries: boolean;
  setActiveApiaryId: (id: string) => void;
  clearActiveApiaryId: () => void;
  setViewAllApiaries: (value: boolean) => void;
}

export const useApiaryStore = create<ApiaryState>(set => {
  // Initialize from localStorage
  const apiaryFromLocalStorage = localStorage.getItem(APIARY_SELECTION);
  const viewAllFromLocalStorage =
    localStorage.getItem(VIEW_ALL_APIARIES) === 'true';

  return {
    activeApiaryId: apiaryFromLocalStorage || null,
    viewAllApiaries: viewAllFromLocalStorage,
    setActiveApiaryId: (id: string) => {
      // Always update localStorage first to ensure the interceptor has access to the latest value.
      // Note: this is the low-level setter for the concrete apiary (also used as
      // the write target). It intentionally does NOT change viewAllApiaries, so
      // the auto-select effect below can refresh the write target without
      // leaving the "all apiaries" view. Use setViewAllApiaries to toggle mode.
      localStorage.setItem(APIARY_SELECTION, id);
      set({ activeApiaryId: id });
    },
    clearActiveApiaryId: () => {
      localStorage.removeItem(APIARY_SELECTION);
      set({ activeApiaryId: null });
    },
    setViewAllApiaries: (value: boolean) => {
      if (value) {
        localStorage.setItem(VIEW_ALL_APIARIES, 'true');
      } else {
        localStorage.removeItem(VIEW_ALL_APIARIES);
      }
      set({ viewAllApiaries: value });
    },
  };
});

export const useApiary = () => {
  const { data: apiaries } = useApiaries();
  const {
    activeApiaryId,
    viewAllApiaries,
    setActiveApiaryId,
    clearActiveApiaryId,
    setViewAllApiaries,
  } = useApiaryStore(
    useShallow(state => ({
      activeApiaryId: state.activeApiaryId,
      viewAllApiaries: state.viewAllApiaries,
      setActiveApiaryId: state.setActiveApiaryId,
      clearActiveApiaryId: state.clearActiveApiaryId,
      setViewAllApiaries: state.setViewAllApiaries,
    })),
  );

  // Validate activeApiaryId against user's apiaries and auto-select
  useEffect(() => {
    if (!apiaries) return;

    if (apiaries.length === 0) {
      // User has no apiaries — clear any stale selection and leave all-view.
      if (activeApiaryId) {
        clearActiveApiaryId();
      }
      if (viewAllApiaries) {
        setViewAllApiaries(false);
      }
    } else if (!activeApiaryId || !apiaries.some(a => a.id === activeApiaryId)) {
      // No selection or stale selection — set to first available. This keeps a
      // valid write target even while viewing all apiaries.
      setActiveApiaryId(apiaries[0].id);
    }
  }, [
    apiaries,
    activeApiaryId,
    viewAllApiaries,
    setActiveApiaryId,
    clearActiveApiaryId,
    setViewAllApiaries,
  ]);

  // Find the active apiary object
  const activeApiary = apiaries?.find(
    (apiary: ApiaryResponse) => apiary.id === activeApiaryId,
  );

  return {
    activeApiary,
    setActiveApiaryId,
    setViewAllApiaries,
    viewAllApiaries,
    apiaries,
    activeApiaryId,
  };
};
