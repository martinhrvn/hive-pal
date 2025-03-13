import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from '@/pages/login-page.tsx';
import RegisterPage from '@/pages/register-page.tsx';
import { ProtectedRoute } from './protected-route.tsx';
import { NotFoundPage } from '@/pages/not-found-page.tsx';
import DasboardLayout from '@/components/layout/dashboard-layout.tsx';
import { HomePage } from '@/pages/home-page.tsx';
import { CreateHivePage, HiveListPage } from '@/pages/hive';
import { HiveDetailPage } from '@/pages/hive/hive-detail-page';
import { 
  CreateInspectionPage, 
  InspectionDetailPage, 
  EditInspectionPage,
  InspectionListPage 
} from '@/pages/inspection';
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
        path: '/hives',
        element: <HiveListPage />,
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
        path: '/inspections',
        element: <InspectionListPage />,
      },
      {
        path: '/inspections/list/:view',
        element: <InspectionListPage />,
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
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
