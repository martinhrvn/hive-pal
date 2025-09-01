import './App.css';
import { AppRouter } from '@/routes';
import { Providers } from '@/context/providers.tsx';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@sentry/react';

function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <AppRouter />
        <Toaster />
      </Providers>
    </ErrorBoundary>
  );
}

export default App;
