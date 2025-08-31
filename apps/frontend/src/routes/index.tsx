import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from '@/pages/login-page.tsx';
import RegisterPage from '@/pages/register-page.tsx';
import { ProtectedRoute } from './protected-route.tsx';
import { AdminProtectedRoute } from './admin-protected-route.tsx';
import { NotFoundPage } from '@/pages/not-found-page.tsx';
import DasboardLayout from '@/components/layout/dashboard-layout.tsx';
import { HomePage } from '@/pages/home-page.tsx';
import { CreateHivePage, HiveListPage } from '@/pages/hive';
import { HiveDetailPage } from '@/pages/hive/hive-detail-page';
import { QRCodesPrintPage } from '@/pages/hive/qr-codes-print-page';
import {
  CreateInspectionPage,
  InspectionDetailPage,
  EditInspectionPage,
  InspectionListPage,
  ScheduleInspectionPage,
} from '@/pages/inspection';
import { CreateQueenPage } from '@/pages/queen';
import { UserManagementPage } from '@/pages/admin';
import { ChangePasswordPage } from '@/pages/account';
import GenericErrorPage from '@/pages/error-page.tsx';
import {
  CreateApiaryPage,
  ApiaryListPage,
  ApiaryDetailPage,
} from '@/pages/apiaries';
import { UserWizardPage } from '@/pages/onboarding';
import { HarvestListPage } from '@/pages/harvest/harvest-list-page';
import { HarvestDetailPage } from '@/pages/harvest/harvest-detail-page';
import { ReleasesPage } from '@/pages/releases';
import { EquipmentPlanningPage, EquipmentSettingsPage } from '@/pages/equipment';
import { BulkActionsPage } from '@/pages/actions/bulk-actions-page';

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
        path: '/apiaries',
        element: <ApiaryListPage />,
      },
      {
        path: '/apiaries/:id',
        element: <ApiaryDetailPage />,
      },
      {
        path: '/apiaries/create',
        element: <CreateApiaryPage />,
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
        path: '/hives/qr-codes/print',
        element: <QRCodesPrintPage />,
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
        path: '/inspections/schedule',
        element: <ScheduleInspectionPage />,
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
      {
        path: '/harvests',
        element: <HarvestListPage />,
      },
      {
        path: '/harvests/:harvestId',
        element: <HarvestDetailPage />,
      },
      {
        path: '/releases',
        element: <ReleasesPage />,
      },
      {
        path: '/equipment',
        element: <EquipmentPlanningPage />,
      },
      {
        path: '/equipment/settings',
        element: <EquipmentSettingsPage />,
      },
      {
        path: '/actions/bulk',
        element: <BulkActionsPage />,
      },
      {
        path: '/admin/users',
        element: (
          <AdminProtectedRoute>
            <UserManagementPage />
          </AdminProtectedRoute>
        ),
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
    path: '/account/change-password',
    element: <ChangePasswordPage />,
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <UserWizardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
