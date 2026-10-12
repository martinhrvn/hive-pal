import { Fragment, PropsWithChildren, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from './theme-provider';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { AxiosError } from 'axios';
import { SidebarProvider } from '@/components/ui/sidebar.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof AxiosError && error.response?.status === 404) {
          return false;
        }
        return failureCount < 3;
      },
      gcTime: 1000 * 60 * 60 * 24, // 24 hours — keep cached data for persistence
    },
  },
});

// Without storage (prerendering on the server) the persister is a no-op.
const createPersister = () =>
  createSyncStoragePersister({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    key: 'hive-pal-query-cache',
  });

const SKIP_SIDEBAR_PAGES = ['/login', '/register', '/onboarding'];
export const Providers: React.FC<PropsWithChildren> = ({ children }) => {
  const { pathname } = useLocation();
  const [persister] = useState(createPersister);
  const skipSidebar = SKIP_SIDEBAR_PAGES.includes(pathname);
  const SidebarProviderComponent = skipSidebar ? Fragment : SidebarProvider;
  return (
    <SidebarProviderComponent>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
      >
        <AuthProvider>
          <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
    </SidebarProviderComponent>
  );
};
