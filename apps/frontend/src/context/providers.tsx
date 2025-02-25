import { PropsWithChildren } from "react";
import { AuthProvider } from "@/context/auth-context.tsx";
import { ThemeProvider } from "./theme-provider";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import axios from "axios";

const queryClient = new QueryClient();
axios.defaults.baseURL = import.meta.env.VITE_API_URL
export const Providers: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};
