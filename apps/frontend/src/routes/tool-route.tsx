import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { PublicLayout } from '@/components/layout/public-layout';

export function ToolRoute() {
  const { isLoggedIn, isLoading } = useAuth();

  // Wait for the session check before picking the chrome. isLoggedIn is false
  // while the session is still being fetched, so a logged-in refresh would
  // otherwise flash the public marketing layout before the dashboard. On a
  // prerendered page (logged-out by construction) isLoading starts false, so
  // hydration still matches the server markup.
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return isLoggedIn ? <DashboardLayout /> : <PublicLayout />;
}
