import { createContext } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  passwordChangeRequired?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (
    username: string,
    password: string,
    from?: string,
  ) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    name?: string,
    privacyPolicyConsent?: boolean,
    newsletterConsent?: boolean,
    redirectTo?: string,
  ) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
