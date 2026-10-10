import { Outlet } from 'react-router-dom';
import { AdminProtectedRoute } from '@/routes/admin-protected-route';

export default function Admin() {
  return (
    <AdminProtectedRoute>
      <Outlet />
    </AdminProtectedRoute>
  );
}
