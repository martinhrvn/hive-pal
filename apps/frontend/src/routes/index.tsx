import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from "@/pages/login-page.tsx";
import { ProtectedRoute } from "./protected-route.tsx";
import { NotFoundPage } from "@/pages/not-found-page.tsx";
import DasboardLayout from "@/components/layout/DashboardLayout.tsx";
import { HomePage } from "@/pages/home-page.tsx";
import { CreateHivePage } from "@/pages/hive/create-hive-page.tsx";
import { HiveDetailPage } from "@/pages/hive/hive-detail-page.tsx";
import { CreateInspectionPage } from "@/pages/inspection/create-inspection.tsx";
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DasboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/hives/create",
        element: <CreateHivePage />,
      },
      {
        path: "/hives/:id",
        element: <HiveDetailPage />,
      },
      {
        path: "/hives/:hiveId/inspections/create",
        element: <CreateInspectionPage />,
      },
      {
        path: "/inspections/create",
        element: <CreateInspectionPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
