import { useApiaryStore } from './use-apiary';

/**
 * The apiary scope of list queries: 'all' in the all-apiaries view, otherwise
 * the selected apiary id (null when nothing is selected yet). Part of every
 * scoped query key so the persisted cache never serves a cross-apiary result
 * for a single apiary, or vice versa.
 */
export const useApiaryScope = (): string | null => {
  const activeApiaryId = useApiaryStore(state => state.activeApiaryId);
  const viewAllApiaries = useApiaryStore(state => state.viewAllApiaries);
  return viewAllApiaries ? 'all' : activeApiaryId;
};
