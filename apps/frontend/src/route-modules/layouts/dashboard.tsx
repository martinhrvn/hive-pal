import { ProtectedRoute } from '@/routes/protected-route';
import DashboardLayout from '@/components/layout/dashboard-layout';

/**
 * The authenticated app: session guard plus dashboard chrome. At `/` a
 * logged-out visitor is shown the landing page by ProtectedRoute instead.
 */
export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  );
}
