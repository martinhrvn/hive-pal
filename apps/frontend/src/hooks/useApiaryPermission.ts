import { useApiary } from './use-apiary';
import type { ApiaryRole } from 'shared-schemas';

const roleCanEdit = (role: ApiaryRole | undefined) =>
  role === 'OWNER' || role === 'EDITOR';

/**
 * Edit permissions derived from the user's role on an apiary.
 *
 * Pass the apiary a resource belongs to (e.g. `hive.apiaryId`) so controls
 * reflect that apiary's role even in the all-apiaries view, where the
 * selected apiary may differ from the resource's. Without an argument the
 * selected apiary is used, which is right for "create here" actions that
 * target it. `canEditApiary` answers the same question per row.
 */
export const useApiaryPermission = (apiaryId?: string | null) => {
  const { activeApiary, apiaries, viewAllApiaries } = useApiary();

  const roleFor = (id?: string | null): ApiaryRole | undefined =>
    id ? apiaries?.find(apiary => apiary.id === id)?.role : undefined;

  const role: ApiaryRole | undefined = apiaryId
    ? roleFor(apiaryId)
    : activeApiary?.role;
  const isOwner = role === 'OWNER';
  const canEdit = roleCanEdit(role);

  // Per-resource check; falls back to the selected apiary when the resource's
  // apiary is unknown (e.g. still loading).
  const canEditApiary = (id?: string | null): boolean =>
    id ? roleCanEdit(roleFor(id)) : canEdit;

  // Whether the user can edit at least one apiary (used by route guards in
  // the all-apiaries view, where no single apiary is selected).
  const canEditAny =
    apiaries?.some(apiary => roleCanEdit(apiary.role)) ?? false;

  return {
    role,
    isOwner,
    canEdit,
    canEditApiary,
    canEditAny,
    viewAllApiaries,
    isLoaded: apiaries !== undefined,
  };
};
