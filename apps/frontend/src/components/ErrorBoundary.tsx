import * as Sentry from '@sentry/react';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-4xl font-bold">Oops! Something went wrong</h1>
        <p className="mb-6 text-gray-600">
          We've encountered an unexpected error. Our team has been notified.
        </p>
        {import.meta.env.DEV && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer font-semibold">Error Details</summary>
            <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs">
              {error.message}
              {error.stack}
            </pre>
          </details>
        )}
        <div className="space-x-4">
          <Button onClick={resetError}>Try Again</Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export const ErrorBoundary = Sentry.withErrorBoundary(
  ({ children }: ErrorBoundaryProps) => <>{children}</>,
  {
    fallback: ErrorFallback,
    showDialog: false,
  }
);