# Sentry Error Tracking Setup

This application has been configured with Sentry for error tracking and performance monitoring.

## Configuration

### Frontend (React)

1. Add your Sentry DSN to the `.env` file:
```env
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
```

2. The Sentry initialization is automatically handled in `src/lib/sentry.ts` and imported in `src/main.tsx`.

3. Error boundaries are set up to catch React component errors automatically.

### Backend (NestJS)

1. Add your Sentry DSN to the `.env` file:
```env
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

2. Sentry is automatically initialized in `src/sentry/sentry.setup.ts` and imported in `src/main.ts`.

3. The `SentryModule` provides global exception filtering and request interception.

## Features

### Frontend
- Automatic error boundary for unhandled React errors
- Browser tracing for performance monitoring
- Session replay on errors
- Custom error handling with user-friendly fallback UI

### Backend
- Automatic exception capture for 500+ errors
- Request/response tracing
- Performance profiling
- Integration with NestJS interceptors and filters

## Testing Error Tracking

### Frontend Test Component
A test component is available at `src/components/TestSentry.tsx`. You can import and use it to test:
- Sending test messages
- Capturing handled exceptions
- Throwing unhandled errors

### Backend Test Endpoints (Development Only)
When running in development mode, test endpoints are available:
- `GET /api/test-sentry/message` - Send a test message
- `GET /api/test-sentry/exception` - Capture a handled exception
- `GET /api/test-sentry/error` - Throw an unhandled error
- `GET /api/test-sentry/http-error` - Throw an HTTP 500 error

## Getting Your Sentry DSN

1. Sign up for a free account at [sentry.io](https://sentry.io)
2. Create a new project for your application
3. Copy the DSN from the project settings
4. Add it to your `.env` files

## Monitoring

Once configured, you can monitor errors and performance at:
- Sentry Dashboard: https://sentry.io
- View error details, stack traces, and user context
- Monitor performance metrics and traces
- Set up alerts for critical errors