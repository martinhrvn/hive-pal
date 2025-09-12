import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { useReleaseNotesNotification } from '@/hooks/use-release-notes-notification.tsx';
import { LandingPage } from '@/pages/landing-page.tsx';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  // Initialize release notes notifications for logged-in users
  useReleaseNotesNotification();

  if (!isLoggedIn) {
    // Show landing page for root path, redirect to login for other protected paths
    if (location.pathname === '/') {
      return <LandingPage />;
    }
    // For other paths, still redirect to login to preserve the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
