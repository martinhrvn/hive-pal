import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";
import { getApiUrl } from "@/api/client.ts";

const TOKEN_KEY = "hive_pal_auth_token";

interface AuthContextType {
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize from localStorage
    return localStorage.getItem(TOKEN_KEY);
  });

  const isAuthenticated = !!token;

  // Create an axios instance or fetch wrapper with the auth token
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  const login = useCallback(
    async (username: string, password: string, from: string = "/") => {
      try {
        const token = await axios.post(getApiUrl("/api/auth/login"), {
          username,
          password,
        });

        // In production, this would be an API call
        if (token.data) {
          setToken(token.data);
          window.location.href = from;
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error("Login error:", error);
        setToken(null);
        return false;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
  }, []);
  const value = useMemo(
    () => ({ token, login, logout, isAuthenticated }),
    [token, login, logout, isAuthenticated],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
