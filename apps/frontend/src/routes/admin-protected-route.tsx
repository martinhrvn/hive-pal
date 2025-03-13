import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { decodeJwt } from '../utils/jwt-utils';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
}) => {
  const { isLoggedIn, token } = useAuth();

  if (!isLoggedIn || !token) {
    // If not logged in, redirect to login
    return <Navigate to="/login" />;
  }

  // First check token - this is more secure since it can't be tampered with client-side
  const decodedToken = token ? decodeJwt(token) : null;
  // Use role from token if available, otherwise fall back to user object
  const role = decodedToken?.role;

  if (role !== 'ADMIN') {
    // If logged in but not an admin, redirect to home
    return <Navigate to="/" />;
  }

  // User is logged in and is an admin
  return <>{children}</>;
};
