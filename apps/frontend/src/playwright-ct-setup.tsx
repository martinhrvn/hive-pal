import { beforeMount } from '@playwright/experimental-ct-react/hooks';
import './index.css';
import { ThemeProvider } from './context/theme-provider';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

beforeMount(async ({ App }) => {
  // Wrap component in providers needed for testing
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  );
});
