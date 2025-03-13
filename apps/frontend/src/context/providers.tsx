import { PropsWithChildren } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from './theme-provider';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { getEnvVariable } from '@/api/client.ts';
import { SidebarProvider } from '@/components/ui/sidebar.tsx';

const queryClient = new QueryClient();
axios.defaults.baseURL = getEnvVariable('VITE_API_URL');
export const Providers: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <SidebarProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
        </QueryClientProvider>
      </AuthProvider>
    </SidebarProvider>
  );
};
