import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { useReleaseNotesNotification } from '@/hooks/use-release-notes-notification.tsx';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  // Initialize release notes notifications for logged-in users
  useReleaseNotesNotification();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
