import { useAuth } from '../context/auth-context';
import { decodeJwt } from '../utils/jwt-utils';

/**
 * A hook to check if the current user is an admin
 * Uses the JWT token as the source of truth, with user object as fallback
 * @returns boolean - true if user is admin, false otherwise
 */
export function useIsAdmin(): boolean {
  const { user, token } = useAuth();
  
  if (!token) {
    return false;
  }
  
  // First check role from token (more secure, can't be tampered with)
  const decodedToken = decodeJwt(token);
  if (decodedToken?.role === 'ADMIN') {
    return true;
  }
  
  // Fallback to user object
  return user?.role === 'ADMIN';
}