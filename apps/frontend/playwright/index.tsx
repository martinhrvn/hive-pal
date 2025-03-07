import { beforeMount } from '@playwright/experimental-ct-react/hooks';
import { ThemeProvider } from '../src/context/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
beforeMount(async ({ App }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  );
});
