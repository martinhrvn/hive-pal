import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './lib/i18n';
import App from './App.tsx';

console.log(import.meta.env.VITE_SENTRY_DSN);
Sentry.init({
  dsn: 'https://69191dcb0ec82fe0e89271082e2e0074@o4509944733499392.ingest.de.sentry.io/4509944759058512',
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
  sendDefaultPii: true,
  sendClientReports: true,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
