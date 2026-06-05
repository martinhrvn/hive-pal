import { useAuth } from '@/context/auth-context';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { PublicLayout } from '@/components/layout/public-layout';

export function ToolRoute() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <DashboardLayout /> : <PublicLayout />;
}
