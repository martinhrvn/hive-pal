import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from '@/pages/login-page.tsx';
import RegisterPage from '@/pages/register-page.tsx';
import ForgotPasswordPage from '@/pages/forgot-password-page.tsx';
import ResetPasswordPage from '@/pages/reset-password-page.tsx';
import { ProtectedRoute } from './protected-route.tsx';
import { AdminProtectedRoute } from './admin-protected-route.tsx';
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
import { CreateQueenPage, EditQueenPage, QueenDetailPage, QueenListPage } from '@/pages/queen';
import { TodoListPage } from '@/pages/todo';
import { ChangePasswordPage } from '@/pages/account';
import GenericErrorPage from '@/pages/error-page.tsx';
import {
  CreateApiaryPage,
  EditApiaryPage,
  ApiaryListPage,
} from '@/pages/apiaries';
import { ReleasesPage } from '@/pages/releases';
import { DataTransferPage, UserSettingsPage } from '@/pages/settings';
import { FeedbackPage } from '@/pages/feedback';
import { PrivacyPolicyPage } from '@/pages/privacy-policy-page';
import { SharedPage } from '@/pages/shared/shared-page';
import { JoinApiaryPage } from '@/pages/join/join-apiary-page';
import { EditableRoute } from './editable-route';
import { ToolRoute } from './tool-route';
import { LandingPage } from '@/pages/landing-page';
import { FeaturesPage } from '@/pages/features-page';
import { LangLayout } from '@/components/i18n/lang-layout';
import { isSupportedLanguage } from '@/utils/language-utils';
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
const WorkerTokensPage = lazyWithRetry(
  () => import('@/pages/admin/worker-tokens/worker-tokens-page'),
);
const AdminMediaPage = lazyWithRetry(
  () => import('@/pages/admin/media/media-page'),
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
const FilesPage = lazyWithRetry(() =>
  import('@/pages/files/files-page').then(m => ({
    default: m.FilesPage,
  })),
);
const ToolsIndexPage = lazyWithRetry(() =>
  import('@/pages/tools/tools-index-page').then(m => ({
    default: m.ToolsIndexPage,
  })),
);
const SyrupCalculatorPage = lazyWithRetry(() =>
  import('@/pages/tools/syrup-calculator-page').then(m => ({
    default: m.SyrupCalculatorPage,
  })),
);
const BroodTimelinePage = lazyWithRetry(() =>
  import('@/pages/tools/brood-timeline-page').then(m => ({
    default: m.BroodTimelinePage,
  })),
);
const SwarmManagementOverviewPage = lazyWithRetry(() =>
  import('@/pages/tools/swarm-management-overview-page').then(m => ({
    default: m.SwarmManagementOverviewPage,
  })),
);
const DemareeMethodPage = lazyWithRetry(() =>
  import('@/pages/tools/demaree-method-page').then(m => ({
    default: m.DemareeMethodPage,
  })),
);

const HiveScalePage = lazyWithRetry(() =>
  import('@/pages/hivescale/hivescale-page').then(m => ({
    default: m.HiveScalePage,
  })),
);

const AssistantPage = lazyWithRetry(() =>
  import('@/pages/assistant/assistant-page').then(m => ({
    default: m.AssistantPage,
  })),
);

// Fullscreen mobile inspection flows (no dashboard chrome).
const MobileWizardPage = lazyWithRetry(() =>
  import('@/pages/inspection/mobile-wizard/mobile-wizard-page').then(m => ({
    default: m.MobileWizardPage,
  })),
);
const AudioQuickPage = lazyWithRetry(() =>
  import('@/pages/inspection/audio-quick/audio-quick-page').then(m => ({
    default: m.AudioQuickPage,
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

// Public tool routes, reused both at the unprefixed path and under `/:lang`.
function buildToolsChildren() {
  return [
    {
      index: true,
      element: (
        <LazyPage>
          <ToolsIndexPage />
        </LazyPage>
      ),
    },
    {
      path: 'syrup-calculator',
      element: (
        <LazyPage>
          <SyrupCalculatorPage />
        </LazyPage>
      ),
    },
    {
      path: 'brood-timeline',
      element: (
        <LazyPage>
          <BroodTimelinePage />
        </LazyPage>
      ),
    },
    {
      path: 'swarm-management',
      element: (
        <LazyPage>
          <SwarmManagementOverviewPage />
        </LazyPage>
      ),
    },
    {
      path: 'swarm-management/demaree',
      element: (
        <LazyPage>
          <DemareeMethodPage />
        </LazyPage>
      ),
    },
  ];
}

// Public, SEO-indexed pages. Mounted under `/:lang` so each language gets its
// own crawlable URL. The English (default) versions stay at the unprefixed
// paths declared separately below and remain canonical.
function buildPublicRoutes() {
  return [
    {
      index: true,
      element: <LandingPage />,
    },
    {
      path: 'features',
      element: <FeaturesPage />,
    },
    {
      path: 'tools',
      element: <ToolRoute />,
      children: buildToolsChildren(),
    },
    {
      path: 'releases',
      element: <ReleasesPage />,
    },
    {
      path: 'privacy-policy',
      element: <PrivacyPolicyPage />,
    },
  ];
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
        element: <EditableRoute redirectTo="/apiaries"><CreateApiaryPage /></EditableRoute>,
      },
      {
        path: '/apiaries/:id/edit',
        element: <EditableRoute redirectTo="/apiaries"><EditApiaryPage /></EditableRoute>,
      },
      {
        path: '/hives',
        element: <HiveListPage />,
      },
      {
        path: '/hives/create',
        element: <EditableRoute redirectTo="/hives"><CreateHivePage /></EditableRoute>,
      },
      {
        path: '/hives/:id',
        element: <HiveDetailPage />,
      },
      {
        path: '/hives/:id/edit',
        element: <EditableRoute redirectTo="/hives"><EditHivePage /></EditableRoute>,
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
        element: <EditableRoute redirectTo="/inspections"><CreateInspectionPage /></EditableRoute>,
      },
      {
        path: '/inspections/create',
        element: <EditableRoute redirectTo="/inspections"><CreateInspectionPage /></EditableRoute>,
      },
      {
        path: '/inspections/schedule',
        element: <EditableRoute redirectTo="/inspections"><ScheduleInspectionPage /></EditableRoute>,
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
        element: <EditableRoute redirectTo="/inspections"><EditInspectionPage /></EditableRoute>,
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
          <LazyPage>
            <BatchInspectionPage />
          </LazyPage>
        ),
      },
      {
        path: '/queens/create',
        element: <EditableRoute redirectTo="/queens"><CreateQueenPage /></EditableRoute>,
      },
      {
        path: '/hives/:hiveId/queens/create',
        element: <EditableRoute redirectTo="/queens"><CreateQueenPage /></EditableRoute>,
      },
      {
        path: '/queens/:queenId/edit',
        element: <EditableRoute redirectTo="/queens"><EditQueenPage /></EditableRoute>,
      },
      {
        path: '/queens',
        element: <QueenListPage />,
      },
      {
        path: '/queens/:queenId',
        element: <QueenDetailPage />,
      },
      {
        path: '/todos',
        element: <TodoListPage />,
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
          <LazyPage>
            <BulkActionsPage />
          </LazyPage>
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
        path: '/hivescale',
        element: (
          <LazyPage>
            <HiveScalePage />
          </LazyPage>
        ),
      },
      {
        path: '/assistant',
        element: (
          <LazyPage>
            <AssistantPage />
          </LazyPage>
        ),
      },
      {
        path: '/files',
        element: (
          <LazyPage>
            <FilesPage />
          </LazyPage>
        ),
      },
      {
        path: '/settings',
        element: <UserSettingsPage />,
      },
      {
        path: '/settings/data-transfer',
        element: <DataTransferPage />,
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
        path: '/admin/worker-tokens',
        element: (
          <AdminProtectedRoute>
            <LazyPage>
              <WorkerTokensPage />
            </LazyPage>
          </AdminProtectedRoute>
        ),
      },
      {
        path: '/admin/media',
        element: (
          <AdminProtectedRoute>
            <LazyPage>
              <AdminMediaPage />
            </LazyPage>
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
    path: '/tools',
    element: <ToolRoute />,
    errorElement: <GenericErrorPage />,
    children: buildToolsChildren(),
  },
  {
    path: '/releases',
    element: <ReleasesPage />,
  },
  {
    path: '/features',
    element: <FeaturesPage />,
  },
  {
    path: '/hives/:hiveId/inspect/mobile',
    element: (
      <ProtectedRoute>
        <EditableRoute redirectTo="/inspections">
          <LazyPage>
            <MobileWizardPage />
          </LazyPage>
        </EditableRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/hives/:hiveId/inspect/audio',
    element: (
      <ProtectedRoute>
        <EditableRoute redirectTo="/inspections">
          <LazyPage>
            <AudioQuickPage />
          </LazyPage>
        </EditableRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/shared/:token',
    element: <SharedPage />,
  },
  {
    path: '/join/:token',
    element: <JoinApiaryPage />,
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicyPage />,
  },
  {
    // Language-prefixed public pages (e.g. /da/tools/syrup-calculator). Static
    // public paths above are matched first, so this only captures genuine
    // first-segment language codes. Unsupported codes render the 404 page.
    path: '/:lang',
    loader: ({ params }) => {
      if (!params.lang || !isSupportedLanguage(params.lang)) {
        throw new Response('Not Found', { status: 404 });
      }
      return null;
    },
    element: <LangLayout />,
    errorElement: <NotFoundPage />,
    children: buildPublicRoutes(),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
