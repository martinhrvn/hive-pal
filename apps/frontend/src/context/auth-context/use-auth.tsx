// Custom hook to use the auth context
import { useContext } from 'react';
import { AuthContext } from '@/context/auth-context/auth-context.ts';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
