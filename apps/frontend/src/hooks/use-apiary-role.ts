import { useAuth } from '@/context/auth-context';
import { useApiaryMembers } from '@/api/hooks';
import { decodeJwt } from '@/utils/jwt-utils';

export type ApiaryMemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

/**
 * Returns the current user's role in the given apiary, a `canEdit` flag
 * (true for OWNER/EDITOR), and an `isLoading` flag while membership is fetching.
 */
export function useApiaryRole(apiaryId: string | null | undefined): {
  role: ApiaryMemberRole | null;
  canEdit: boolean;
  isLoading: boolean;
} {
  const { token } = useAuth();
  const { data: members, isLoading } = useApiaryMembers(apiaryId ?? '');

  if (!token || !apiaryId) return { role: null, canEdit: true, isLoading: false };

  const decoded = decodeJwt(token);
  if (!decoded?.sub) return { role: null, canEdit: true, isLoading: false };

  if (isLoading) return { role: null, canEdit: true, isLoading: true };

  const member = members?.find(m => m.userId === decoded.sub);
  const role = (member?.role as ApiaryMemberRole) ?? null;
  const canEdit = role !== 'VIEWER';

  return { role, canEdit, isLoading: false };
}
