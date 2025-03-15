import { Fragment, PropsWithChildren } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from './theme-provider';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { getEnvVariable } from '@/api/client.ts';
import { SidebarProvider } from '@/components/ui/sidebar.tsx';

const queryClient = new QueryClient();
axios.defaults.baseURL = getEnvVariable('VITE_API_URL');

const SKIP_SIDEBAR_PAGES = ['/login', '/register', '/onboarding'];
export const Providers: React.FC<PropsWithChildren> = ({ children }) => {
  const pathname = window.location.pathname;
  const skipSidebar = SKIP_SIDEBAR_PAGES.includes(pathname);
  const SidebarProviderComponent = skipSidebar ? Fragment : SidebarProvider;
  return (
    <SidebarProviderComponent>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SidebarProviderComponent>
  );
};
