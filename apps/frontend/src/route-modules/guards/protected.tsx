import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/protected-route';

/** Session guard for logged-in pages rendered without the dashboard chrome. */
export default function Protected() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
}
