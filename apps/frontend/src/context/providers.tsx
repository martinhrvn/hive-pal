import { PropsWithChildren } from "react";
import { AuthProvider } from "@/context/auth-context.tsx";
import { ThemeProvider } from "./theme-provider";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { getEnvVariable } from "@/api/client.ts";

const queryClient = new QueryClient();
axios.defaults.baseURL = getEnvVariable("VITE_API_URL");
export const Providers: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};
