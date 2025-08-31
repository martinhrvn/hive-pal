import { create } from 'zustand';

interface BreadcrumbContext {
  hive?: {
    id: string;
    name: string;
  };
  
  inspection?: {
    id: string;
    date: string;
    hiveId: string;
  };
  
  queen?: {
    id: string;
    name?: string;
    hiveId?: string;
  };
  
  harvest?: {
    id: string;
    date: string;
    hiveId?: string;
  };
}

interface BreadcrumbStore {
  context: BreadcrumbContext;
  
  setHiveContext: (hive: { id: string; name: string } | undefined) => void;
  setInspectionContext: (inspection: { id: string; date: string; hiveId: string } | undefined) => void;
  setQueenContext: (queen: { id: string; name?: string; hiveId?: string } | undefined) => void;
  setHarvestContext: (harvest: { id: string; date: string; hiveId?: string } | undefined) => void;
  
  clearContext: (type?: 'hive' | 'inspection' | 'queen' | 'harvest') => void;
  clearAllContext: () => void;
}

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
  context: {},
  
  setHiveContext: (hive) => 
    set((state) => ({
      context: {
        ...state.context,
        hive,
      }
    })),
    
  setInspectionContext: (inspection) =>
    set((state) => ({
      context: {
        ...state.context,
        inspection,
      }
    })),
    
  setQueenContext: (queen) =>
    set((state) => ({
      context: {
        ...state.context,
        queen,
      }
    })),
    
  setHarvestContext: (harvest) =>
    set((state) => ({
      context: {
        ...state.context,
        harvest,
      }
    })),
    
  clearContext: (type) => 
    set((state) => {
      if (!type) return state;
      const newContext = { ...state.context };
      delete newContext[type];
      return { context: newContext };
    }),
    
  clearAllContext: () =>
    set(() => ({
      context: {}
    })),
}));