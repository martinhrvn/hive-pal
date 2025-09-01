import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './lib/i18n';
import App from './App.tsx';
import { getEnvVariable } from '@/utils/get-env.ts';

console.log(import.meta.env.VITE_SENTRY_DSN);
Sentry.init({
  dsn: getEnvVariable('VITE_SENTRY_DSN'),
  environment: getEnvVariable('VITE_SENTRY_ENVIRONMENT') || 'development',
  sendDefaultPii: true,
  sendClientReports: true,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
