import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from "@/pages/LoginPage.tsx";
import { ProtectedRoute } from "./ProtectedRoute";
import { NotFoundPage } from "@/pages/NotFoundPage.tsx";
import DasboardLayout from "@/components/layout/DashboardLayout.tsx";
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
        element: <div>Home</div>,
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
