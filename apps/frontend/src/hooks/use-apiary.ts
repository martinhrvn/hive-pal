import { useNavigate } from 'react-router-dom';
import { ApiaryResponseDto, useApiariesControllerFindAll } from 'api-client';
import { useEffect } from 'react';
import { APIARY_SELECTION } from '@/context/auth-context';
import { useIsAdmin } from '@/hooks/use-is-admin.ts';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

interface ApiaryState {
  activeApiaryId: string | null;
  setActiveApiaryId: (id: string) => void;
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
  };
});

export const useApiary = () => {
  const navigate = useNavigate();
  const { data: apiaries } = useApiariesControllerFindAll({
    query: { select: data => data.data },
  });
  const isAdmin = useIsAdmin();
  const { activeApiaryId, setActiveApiaryId } = useApiaryStore(
    useShallow(state => ({
      activeApiaryId: state.activeApiaryId,
      setActiveApiaryId: state.setActiveApiaryId,
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

  // Set first apiary as active if none is selected
  useEffect(() => {
    if (!activeApiaryId && apiaries?.length) {
      setActiveApiaryId(apiaries[0].id);
    }
  }, [apiaries, activeApiaryId, setActiveApiaryId]);

  // Find the active apiary object
  const activeApiary = apiaries?.find(
    (apiary: ApiaryResponseDto) => apiary.id === activeApiaryId,
  );

  return { activeApiary, setActiveApiaryId, apiaries, activeApiaryId };
};
