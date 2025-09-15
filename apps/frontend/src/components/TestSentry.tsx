import { Button } from '@/components/ui/button';
import * as Sentry from '@sentry/react';

export function TestSentry() {
  const throwError = () => {
    throw new Error('Test error for Sentry');
  };

  const captureMessage = () => {
    Sentry.captureMessage('Test message from frontend', 'info');
    alert('Message sent to Sentry!');
  };

  const captureException = () => {
    try {
      const result = JSON.parse('invalid json');
      console.log(result);
    } catch (error) {
      Sentry.captureException(error);
      alert('Exception captured and sent to Sentry!');
    }
  };

  if (!import.meta.env.VITE_SENTRY_DSN) {
    return (
      <div className="p-4 text-yellow-600">
        Sentry is not configured. Add VITE_SENTRY_DSN to your .env file.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Sentry Error Tracking Test</h2>
      <div className="space-x-4">
        <Button onClick={captureMessage} variant="outline">
          Send Test Message
        </Button>
        <Button onClick={captureException} variant="outline">
          Capture Exception
        </Button>
        <Button onClick={throwError} variant="destructive">
          Throw Error (Will crash component)
        </Button>
      </div>
    </div>
  );
}
