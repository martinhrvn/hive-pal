import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from "@/pages/LoginPage.tsx";
import { ProtectedRoute } from "./ProtectedRoute";
import { NotFoundPage } from "@/pages/NotFoundPage.tsx";
import DasboardLayout from "@/components/layout/DashboardLayout.tsx";
import { HomePage } from "@/pages/HomePage.tsx";
import { CreateHivePage } from "@/pages/hive/create-hive-page.tsx";
import { HiveDetailPage } from "@/pages/hive/hive-detail-page.tsx";
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
        path: "/hive/create",
        element: <CreateHivePage />,
      },
      {
        path: "/hive/:id",
        element: <HiveDetailPage />,
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
