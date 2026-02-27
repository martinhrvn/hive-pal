import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { APIARY_SELECTION } from '@/context/auth-context';
import { useIsAdmin } from '@/hooks/use-is-admin.ts';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useApiaries } from '@/api/hooks';
import { ApiaryResponse } from 'shared-schemas';

interface ApiaryState {
  activeApiaryId: string | null;
  setActiveApiaryId: (id: string) => void;
  clearActiveApiaryId: () => void;
}

export const useApiaryStore = create<ApiaryState>(set => {
  // Initialize from localStorage
  const apiaryFromLocalStorage = localStorage.getItem(APIARY_SELECTION);

  return {
    activeApiaryId: apiaryFromLocalStorage || null,
    setActiveApiaryId: (id: string) => {
      // Always update localStorage first to ensure the interceptor has access to the latest value
      localStorage.setItem(APIARY_SELECTION, id);
      set({ activeApiaryId: id });
    },
    clearActiveApiaryId: () => {
      localStorage.removeItem(APIARY_SELECTION);
      set({ activeApiaryId: null });
    },
  };
});

export const useApiary = () => {
  const navigate = useNavigate();
  const { data: apiaries } = useApiaries();
  const isAdmin = useIsAdmin();
  const { activeApiaryId, setActiveApiaryId, clearActiveApiaryId } = useApiaryStore(
    useShallow(state => ({
      activeApiaryId: state.activeApiaryId,
      setActiveApiaryId: state.setActiveApiaryId,
      clearActiveApiaryId: state.clearActiveApiaryId,
    })),
  );

  // Redirect to onboarding wizard if no apiaries exist
  useEffect(() => {
    if (
      apiaries?.length === 0 &&
      window.location.pathname !== '/onboarding' &&
      !isAdmin
    ) {
      navigate('/onboarding');
    }
  }, [apiaries, navigate, isAdmin]);

  // Validate activeApiaryId against user's apiaries and auto-select
  useEffect(() => {
    if (!apiaries) return;

    if (apiaries.length === 0) {
      // User has no apiaries — clear any stale selection
      if (activeApiaryId) {
        clearActiveApiaryId();
      }
    } else if (!activeApiaryId || !apiaries.some(a => a.id === activeApiaryId)) {
      // No selection or stale selection — set to first available
      setActiveApiaryId(apiaries[0].id);
    }
  }, [apiaries, activeApiaryId, setActiveApiaryId, clearActiveApiaryId]);

  // Find the active apiary object
  const activeApiary = apiaries?.find(
    (apiary: ApiaryResponse) => apiary.id === activeApiaryId,
  );

  return { activeApiary, setActiveApiaryId, apiaries, activeApiaryId };
};
