#!/bin/sh
set -e

# Derive the database host/port from DATABASE_URL unless DB_HOST/DB_PORT are set
# explicitly. The service name is not always "postgres": Coolify, for example,
# suffixes it for pull request previews (postgres-pr-243).
if [ -z "$DB_HOST" ] && [ -n "$DATABASE_URL" ]; then
  _hostport="${DATABASE_URL#*://}"   # strip scheme
  _hostport="${_hostport##*@}"       # strip credentials
  _hostport="${_hostport%%/*}"       # strip database name
  _hostport="${_hostport%%\?*}"      # strip query string
  DB_HOST="${_hostport%%:*}"
  case "$_hostport" in
    *:*) DB_PORT="${DB_PORT:-${_hostport##*:}}" ;;
  esac
fi

# Wait for database to be ready
echo "Waiting for database at ${DB_HOST:-postgres}:${DB_PORT:-5432} to be ready..."
until nc -z -v -w30 "${DB_HOST:-postgres}" "${DB_PORT:-5432}" 2>/dev/null
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

# Demo data for the admin user when SEED_DEMO_DATA=true (passed through by
# docker-compose.preview.yml). Skips users that already have hives.
echo "Seeding demo data..."
node /app/apps/backend/dist/scripts/seed-demo.js || echo "Demo data seeding failed (continuing startup)"

echo "Starting application..."
exec "$@"
