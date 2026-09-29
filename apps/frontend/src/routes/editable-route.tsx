import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';

interface EditableRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Route guard that only allows access for users with edit permissions
 * (OWNER or EDITOR role). In single-apiary mode this is the selected apiary's
 * role; in the all-apiaries view the edited resource may live in any apiary,
 * so the guard only requires edit rights on at least one apiary and leaves the
 * exact check to the page and the backend.
 * Redirects VIEWER-only users to the specified path or home.
 */
export function EditableRoute({
  children,
  redirectTo = '/',
}: EditableRouteProps) {
  const { canEdit, canEditAny, viewAllApiaries, isLoaded } =
    useApiaryPermission();

  // Apiaries still loading: render children to avoid a redirect flash
  if (!isLoaded) {
    return <>{children}</>;
  }

  if (!(viewAllApiaries ? canEditAny : canEdit)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
