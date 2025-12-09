# Hive Pal Backend

NestJS backend for the Hive Pal beekeeping management application.

## Setup

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start database
pnpm db:up

# Run migrations
pnpm prisma migrate dev

# Seed database (optional)
pnpm seed

# Start development server
pnpm dev
```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/beekeeper?schema=public` |
| `JWT_SECRET` | Secret key for JWT tokens | `your_jwt_secret` |
| `ADMIN_EMAIL` | Initial admin user email | `admin@hivepal.com` |
| `ADMIN_PASSWORD` | Initial admin user password (bcrypt hash) | `$2a$12$...` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:5173` |
| `FRONTEND_URL` | Frontend URL for email links | `http://localhost:5173` |

### Email (Optional)

The system auto-selects the first configured provider:

| Variable | Description |
|----------|-------------|
| `MAIL_PROVIDER` | Force provider: `resend`, `smtp`, or `none` |
| `RESEND_API_KEY` | Resend API key |
| `FROM_EMAIL` | Sender email address |

**SMTP Configuration:**

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server host | - |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_SECURE` | Use TLS | `false` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASS` | SMTP password | - |

### S3 Storage (Optional - for audio recordings)

| Variable | Description | Default |
|----------|-------------|---------|
| `S3_ENDPOINT` | S3-compatible endpoint | - |
| `S3_REGION` | S3 region | `us-east-1` |
| `S3_BUCKET` | Bucket name | - |
| `S3_ACCESS_KEY_ID` | Access key | - |
| `S3_SECRET_ACCESS_KEY` | Secret key | - |
| `AUDIO_MAX_FILE_SIZE` | Max upload size in bytes | `52428800` (50MB) |

**Local development with MinIO:**

```bash
# Start MinIO
docker compose up -d minio

# Access MinIO console at http://localhost:9001
# Login: minioadmin / minioadmin
# Create bucket: hivepal-audio
```

### Sentry (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `SENTRY_DSN` | Sentry DSN | - |
| `SENTRY_ENVIRONMENT` | Environment name | `development` |
| `SENTRY_TRACES_SAMPLE_RATE` | Tracing sample rate | `0.1` |
| `SENTRY_PROFILES_SAMPLE_RATE` | Profiling sample rate | `0.1` |

## Commands

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start:prod       # Start production server
pnpm test:e2e         # Run E2E tests
pnpm prisma:generate  # Generate Prisma client
pnpm db:up            # Start PostgreSQL container
pnpm seed             # Seed database
```

## API Documentation

Swagger UI available at `http://localhost:3000/api-docs` when running.
