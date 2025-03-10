import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from '@/pages/login-page.tsx';
import { ProtectedRoute } from './protected-route.tsx';
import { NotFoundPage } from '@/pages/not-found-page.tsx';
import DasboardLayout from '@/components/layout/dashboard-layout.tsx';
import { HomePage } from '@/pages/home-page.tsx';
import { CreateHivePage } from '@/pages/hive/create-hive-page.tsx';
import { HiveDetailPage } from '@/pages/hive/hive-detail-page';
import { CreateInspectionPage } from '@/pages/inspection/create-inspection.tsx';
import { InspectionDetailPage } from '@/pages/inspection/inspection-detail-page.tsx';
import { EditInspectionPage } from '@/pages/inspection/edit-inspection.tsx';
import { CreateQueenPage } from '@/pages/queen';
import GenericErrorPage from '@/pages/error-page.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <GenericErrorPage />,
    element: (
      <ProtectedRoute>
        <DasboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/hives/create',
        element: <CreateHivePage />,
      },
      {
        path: '/hives/:id',
        element: <HiveDetailPage />,
      },
      {
        path: '/hives/:hiveId/inspections/create',
        element: <CreateInspectionPage />,
      },
      {
        path: '/inspections/create',
        element: <CreateInspectionPage />,
      },
      {
        path: '/inspections/:id/edit',
        element: <EditInspectionPage />,
      },
      {
        path: '/inspections/:id',
        element: <InspectionDetailPage />,
      },
      {
        path: '/queens/create',
        element: <CreateQueenPage />,
      },
      {
        path: '/hives/:hiveId/queens/create',
        element: <CreateQueenPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
