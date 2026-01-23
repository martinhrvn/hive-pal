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
npx prisma@6 migrate deploy --schema=./apps/backend/prisma/schema.prisma

echo "Starting application..."
exec "$@"
