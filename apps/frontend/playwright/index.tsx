import { beforeMount } from '@playwright/experimental-ct-react/hooks';
import { ThemeProvider } from '../src/context/theme-provider';
import { AuthContext } from '../src/context/auth-context/auth-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../src/lib/i18n';
import i18n from 'i18next';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// ThemeProvider calls useAuth(), which throws without an AuthProvider above it.
// Component tests mount in isolation (no real session/router), so provide a
// stable logged-out stub instead of the real AuthProvider.
const authStub = {
  user: null,
  isLoggedIn: false,
  isLoading: false,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
};
beforeMount(async ({ App }) => {
  if (!i18n.isInitialized) {
    await new Promise<void>(resolve => {
      i18n.on('initialized', () => resolve());
    });
  }
  await i18n.loadNamespaces(['common', 'inspection', 'apiary', 'hive', 'queen', 'auth', 'onboarding']);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authStub}>
        <ThemeProvider defaultTheme="light">
          <App />
        </ThemeProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
});
