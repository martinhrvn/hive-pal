import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './lib/i18n';
import App from './App.tsx';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
