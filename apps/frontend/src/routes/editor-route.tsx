import { Navigate } from 'react-router-dom';
import { useApiaryRole } from '@/hooks/use-apiary-role';
import { useApiaryStore } from '@/hooks/use-apiary';

/**
 * Route guard that blocks VIEWER members from accessing create/edit pages.
 * While the role is being fetched, renders a spinner.
 * Once resolved, VIEWERs are redirected to the home page.
 */
export function EditorRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const activeApiaryId = useApiaryStore(s => s.activeApiaryId);
  const { canEdit, isLoading } = useApiaryRole(activeApiaryId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!canEdit) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
