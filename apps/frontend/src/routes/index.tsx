import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from '@/pages/login-page.tsx';
import RegisterPage from '@/pages/register-page.tsx';
import ForgotPasswordPage from '@/pages/forgot-password-page.tsx';
import ResetPasswordPage from '@/pages/reset-password-page.tsx';
import { ProtectedRoute } from './protected-route.tsx';
import { AdminProtectedRoute } from './admin-protected-route.tsx';
import { EditorRoute } from './editor-route.tsx';
import { NotFoundPage } from '@/pages/not-found-page.tsx';
import DasboardLayout from '@/components/layout/dashboard-layout.tsx';
import { HomePage } from '@/pages/home-page.tsx';
import { CreateHivePage, EditHivePage, HiveListPage } from '@/pages/hive';
import { HiveDetailPage } from '@/pages/hive/hive-detail-page';
import {
  CreateInspectionPage,
  InspectionDetailPage,
  EditInspectionPage,
  InspectionListPage,
  ScheduleInspectionPage,
} from '@/pages/inspection';
import { CreateQueenPage, EditQueenPage } from '@/pages/queen';
import { ChangePasswordPage } from '@/pages/account';
import GenericErrorPage from '@/pages/error-page.tsx';
import { CreateApiaryPage, ApiaryListPage } from '@/pages/apiaries';
import { ReleasesPage } from '@/pages/releases';
import { UserSettingsPage } from '@/pages/settings';
import { FeedbackPage } from '@/pages/feedback';
import { PrivacyPolicyPage } from '@/pages/privacy-policy-page';
import { SharedPage } from '@/pages/shared/shared-page';
import { AcceptInvitePage } from '@/pages/invitations/accept-invite-page';
import { ApproveJoinRequestPage } from '@/pages/join-requests/approve-join-request-page';
import { DenyJoinRequestPage } from '@/pages/join-requests/deny-join-request-page';
import { lazyWithRetry } from '@/lib/lazy-with-retry';

// Lazy loaded components - heavy pages that benefit from code splitting
// Admin pages (only accessed by admins)
const UserManagementPage = lazyWithRetry(
  () => import('@/pages/admin/user-management/user-management-page'),
);
const UserDetailPage = lazyWithRetry(
  () => import('@/pages/admin/user-detail/user-detail-page'),
);
const FeedbackManagementPage = lazyWithRetry(
  () => import('@/pages/admin/feedback-management/feedback-management-page'),
);
const PlatformMetricsPage = lazyWithRetry(
  () => import('@/pages/admin/platform-metrics/platform-metrics-page'),
);
const FrameSizeReviewPage = lazyWithRetry(
  () => import('@/pages/admin/frame-sizes/frame-size-review-page'),
);

// Heavy feature pages (named exports)
const ReportsPage = lazyWithRetry(() =>
  import('@/pages/reports/reports-page').then(m => ({
    default: m.ReportsPage,
  })),
);
const CalendarPage = lazyWithRetry(() =>
  import('@/pages/calendar/calendar-page').then(m => ({
    default: m.CalendarPage,
  })),
);
const ApiaryDetailPage = lazyWithRetry(() =>
  import('@/pages/apiaries/apiary-detail-page').then(m => ({
    default: m.ApiaryDetailPage,
  })),
);

// Equipment pages (specialized feature, named exports)
const EquipmentPlanningPage = lazyWithRetry(() =>
  import('@/pages/equipment/equipment-planning-page').then(m => ({
    default: m.EquipmentPlanningPage,
  })),
);
const EquipmentSettingsPage = lazyWithRetry(() =>
  import('@/pages/equipment/equipment-settings-page').then(m => ({
    default: m.EquipmentSettingsPage,
  })),
);

// Batch inspection pages (less frequently used, named exports)
const BatchListPage = lazyWithRetry(() =>
  import('@/pages/batch-inspection/batch-list-page').then(m => ({
    default: m.BatchListPage,
  })),
);
const BatchDetailPage = lazyWithRetry(() =>
  import('@/pages/batch-inspection/batch-detail-page').then(m => ({
    default: m.BatchDetailPage,
  })),
);
const BatchInspectionPage = lazyWithRetry(() =>
  import('@/pages/batch-inspection/batch-inspection-page').then(m => ({
    default: m.BatchInspectionPage,
  })),
);

// Harvest pages (seasonal/periodic use, named exports)
const HarvestListPage = lazyWithRetry(() =>
  import('@/pages/harvest/harvest-list-page').then(m => ({
    default: m.HarvestListPage,
  })),
);
const HarvestDetailPage = lazyWithRetry(() =>
  import('@/pages/harvest/harvest-detail-page').then(m => ({
    default: m.HarvestDetailPage,
  })),
);

// Other less frequently used pages (named exports)
const QRCodesPrintPage = lazyWithRetry(() =>
  import('@/pages/hive/qr-codes-print-page').then(m => ({
    default: m.QRCodesPrintPage,
  })),
);
const BulkActionsPage = lazyWithRetry(() =>
  import('@/pages/actions/bulk-actions-page').then(m => ({
    default: m.BulkActionsPage,
  })),
);
const UserWizardPage = lazyWithRetry(() =>
  import('@/pages/onboarding/user-wizard-page').then(m => ({
    default: m.UserWizardPage,
  })),
);

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

// Wrapper for lazy-loaded components
function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

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
        element: (
          <LazyPage>
            <ApiaryDetailPage />
          </LazyPage>
        ),
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
        element: <EditorRoute><CreateHivePage /></EditorRoute>,
      },
      {
        path: '/hives/:id',
        element: <HiveDetailPage />,
      },
      {
        path: '/hives/:id/edit',
        element: <EditorRoute><EditHivePage /></EditorRoute>,
      },
      {
        path: '/hives/qr-codes/print',
        element: (
          <LazyPage>
            <QRCodesPrintPage />
          </LazyPage>
        ),
      },
      {
        path: '/hives/:hiveId/inspections/create',
        element: <EditorRoute><CreateInspectionPage /></EditorRoute>,
      },
      {
        path: '/inspections/create',
        element: <EditorRoute><CreateInspectionPage /></EditorRoute>,
      },
      {
        path: '/inspections/schedule',
        element: <EditorRoute><ScheduleInspectionPage /></EditorRoute>,
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
        element: <EditorRoute><EditInspectionPage /></EditorRoute>,
      },
      {
        path: '/inspections/:id',
        element: <InspectionDetailPage />,
      },
      {
        path: '/batch-inspections',
        element: (
          <LazyPage>
            <BatchListPage />
          </LazyPage>
        ),
      },
      {
        path: '/batch-inspections/:id',
        element: (
          <LazyPage>
            <BatchDetailPage />
          </LazyPage>
        ),
      },
      {
        path: '/batch-inspections/:id/inspect',
        element: (
          <EditorRoute>
            <LazyPage>
              <BatchInspectionPage />
            </LazyPage>
          </EditorRoute>
        ),
      },
      {
        path: '/queens/create',
        element: <EditorRoute><CreateQueenPage /></EditorRoute>,
      },
      {
        path: '/hives/:hiveId/queens/create',
        element: <EditorRoute><CreateQueenPage /></EditorRoute>,
      },
      {
        path: '/queens/:queenId/edit',
        element: <EditorRoute><EditQueenPage /></EditorRoute>,
      },
      {
        path: '/harvests',
        element: (
          <LazyPage>
            <HarvestListPage />
          </LazyPage>
        ),
      },
      {
        path: '/harvests/:harvestId',
        element: (
          <LazyPage>
            <HarvestDetailPage />
          </LazyPage>
        ),
      },
      {
        path: '/equipment',
        element: (
          <LazyPage>
            <EquipmentPlanningPage />
          </LazyPage>
        ),
      },
      {
        path: '/equipment/settings',
        element: (
          <LazyPage>
            <EquipmentSettingsPage />
          </LazyPage>
        ),
      },
      {
        path: '/actions/bulk',
        element: (
          <EditorRoute>
            <LazyPage>
              <BulkActionsPage />
            </LazyPage>
          </EditorRoute>
        ),
      },
      {
        path: '/calendar',
        element: (
          <LazyPage>
            <CalendarPage />
          </LazyPage>
        ),
      },
      {
        path: '/reports',
        element: (
          <LazyPage>
            <ReportsPage />
          </LazyPage>
        ),
      },
      {
        path: '/settings',
        element: <UserSettingsPage />,
      },
      {
        path: '/feedback',
        element: <FeedbackPage />,
      },
      {
        path: '/admin/users',
        element: (
          <AdminProtectedRoute>
            <LazyPage>
              <UserManagementPage />
            </LazyPage>
          </AdminProtectedRoute>
        ),
      },
      {
        path: '/admin/users/:id',
        element: (
          <AdminProtectedRoute>
            <LazyPage>
              <UserDetailPage />
            </LazyPage>
          </AdminProtectedRoute>
        ),
      },
      {
        path: '/admin/feedback',
        element: (
          <AdminProtectedRoute>
            <LazyPage>
              <FeedbackManagementPage />
            </LazyPage>
          </AdminProtectedRoute>
        ),
      },
      {
        path: '/admin/frame-sizes',
        element: (
          <AdminProtectedRoute>
            <LazyPage>
              <FrameSizeReviewPage />
            </LazyPage>
          </AdminProtectedRoute>
        ),
      },
      {
        path: '/admin/metrics',
        element: (
          <AdminProtectedRoute>
            <LazyPage>
              <PlatformMetricsPage />
            </LazyPage>
          </AdminProtectedRoute>
        ),
      },
      {
        path: '/invitations/accept/:token',
        element: <AcceptInvitePage />,
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
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/account/change-password',
    element: <ChangePasswordPage />,
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <UserWizardPage />
        </LazyPage>
      </ProtectedRoute>
    ),
  },
  {
    path: '/releases',
    element: <ReleasesPage />,
  },
  {
    path: '/shared/:token',
    element: <SharedPage />,
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicyPage />,
  },
  {
    path: '/join-requests/approve/:token',
    element: <ApproveJoinRequestPage />,
  },
  {
    path: '/join-requests/deny/:token',
    element: <DenyJoinRequestPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
