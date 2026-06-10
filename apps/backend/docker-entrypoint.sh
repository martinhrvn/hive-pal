#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
until nc -z -v -w30 ${DB_HOST:-postgres} ${DB_PORT:-5432} 2>/dev/null
do
  echo "Waiting for database connection..."
  sleep 2
done
echo "Database is ready!"

echo "Running database migrations..."
cd /app/apps/backend/
npx prisma migrate deploy --schema=./prisma/schema.prisma
cd /app

# Seed/promote the admin user from ADMIN_EMAIL/ADMIN_PASSWORD. Idempotent, and
# a no-op when those vars are unset. Non-fatal: a seeding hiccup must not block
# the app from starting.
echo "Seeding admin user..."
node /app/apps/backend/dist/scripts/seed-admin.js || echo "Admin seeding failed (continuing startup)"

echo "Starting application..."
exec "$@"
