import { createContext } from 'react';
export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  passwordChangeRequired?: boolean;
}
interface AuthContextType {
  token: string | null;
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
  ) => Promise<boolean>;
  logout: () => void;
  isLoggedIn: boolean;
}
export const AuthContext = createContext<AuthContextType | null>(null);
