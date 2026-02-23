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
echo "Starting application..."
exec "$@"
