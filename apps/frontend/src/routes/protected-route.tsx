import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useReleaseNotesNotification } from '@/hooks/use-release-notes-notification.tsx';
import { LandingPage } from '@/pages/landing-page.tsx';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  // Initialize release notes notifications for logged-in users
  useReleaseNotesNotification();

  // Wait for the session check to resolve before deciding what to render.
  // Otherwise a refresh briefly flashes the login form (isLoggedIn is false
  // while the session is still being fetched) before jumping to the page.
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
