---
sidebar_position: 3
description: Solutions to common Hive-Pal issues including Docker problems, database errors, and login troubles.
keywords: [hive-pal troubleshooting, beekeeping app issues, docker errors, database problems]
---

import Head from '@docusaurus/Head';

<Head>
  <script type="application/ld+json">
    {JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Why will my Hive-Pal Docker containers not start?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Make sure the host port you mapped for the app is free (80 in the example compose, or 3000 if mapped directly), verify your Docker install, and inspect the logs with docker compose logs app and docker compose logs postgres. PostgreSQL listens on 5432 inside the Docker network and only needs a free host port if you publish it.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why can I not log in with valid credentials?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Hive-Pal uses Better Auth. Ensure BETTER_AUTH_SECRET is set and stable, and that BETTER_AUTH_URL and FRONTEND_URL match the public URL you are accessing. For cross-subdomain setups, set COOKIE_DOMAIN.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why are magic links or password reset emails not arriving?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'These require a configured mail provider (SMTP or Resend). Confirm the mail variables are set, check the app logs for send errors, and verify FROM_EMAIL is allowed by your provider.',
          },
        },
      ],
    })}
  </script>
</Head>

# Troubleshooting

This guide addresses common issues you might encounter while using Hive-Pal.

## Installation Issues

### Docker Container Won't Start

If your Docker containers fail to start:

1. Check that the **host port you mapped for the app** is free (`80` in the example compose, or `3000` if you mapped it directly):
   ```bash
   sudo lsof -i :80
   ```
   PostgreSQL listens on `5432` **inside** the Docker network and only needs a free host port if you publish it. The development compose files deliberately map it to `6543` (`6543:5432`) to avoid clashing with a PostgreSQL already running on your machine.

2. Verify your Docker and Docker Compose installation:
   ```bash
   docker --version
   docker compose version
   ```

3. Check container logs for errors (the app is a single container):
   ```bash
   docker compose logs app
   docker compose logs postgres
   ```

### Database Connection Errors

If the backend can't connect to the database:

1. Ensure your `DATABASE_URL` environment variable is correctly formatted
2. Check if the PostgreSQL container is running:
   ```bash
   docker-compose ps
   ```
3. Try to connect to the database manually to verify credentials:
   ```bash
   docker compose exec postgres psql -U postgres -d beekeeper
   ```

## Login Issues

### Can't Create Admin Account

If you're having trouble with the initial admin account:

1. Verify that the `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables are set correctly
2. Check the app logs for the seeding step (it runs on every startup):
   ```bash
   docker compose logs app | grep -i admin
   ```
3. Try restarting the app container:
   ```bash
   docker compose restart app
   ```

### Login Authentication Failures

Hive-Pal uses [Better Auth](https://www.better-auth.com/) for sign-in. If you can't log in with valid credentials:

1. Check that you're using the correct email/password combination.
2. Verify `BETTER_AUTH_SECRET` is set and **stable** — changing it invalidates all existing sessions.
3. Verify `BETTER_AUTH_URL` and `FRONTEND_URL` match the public URL you're accessing. A mismatch causes session cookies to be rejected.
4. For cross-subdomain setups, set `COOKIE_DOMAIN` (e.g. `.example.com`).
5. Clear your browser cookies and cache, then try again.
6. Check the app logs for authentication errors:
   ```bash
   docker compose logs app | grep -i auth
   ```

### Magic Links or Password Resets Not Arriving

Magic-link sign-in and password resets require a configured mail provider:

1. Confirm SMTP or Resend variables are set (see [Configuration → Email](./self-hosting/configuration#email)).
2. Check the app logs for mail-send errors.
3. Verify `FROM_EMAIL` is an address your provider is allowed to send from.

### Passkeys Not Working

1. Ensure you're on **HTTPS** (WebAuthn requires a secure context, except on `localhost`).
2. Set `PASSKEY_RP_ID` to your domain (it defaults to `localhost`).

## Performance Issues

### Slow Page Loading

If the application is running slowly:

1. Check your server's resources (CPU, memory, disk space)
2. Consider allocating more resources to Docker if available
3. Check for excessive database growth:
   ```bash
   docker exec -it postgres psql -U postgres -d beekeeper -c "SELECT pg_size_pretty(pg_database_size('beekeeper'));"
   ```

### Mobile Device Issues

For problems on mobile devices:

1. Ensure you're using a modern mobile browser (Chrome, Safari, Firefox)
2. Check if your device has a stable internet connection
3. Try clearing the browser cache and cookies

## Data Issues

### Missing Hives or Inspections

If data appears to be missing:

1. Check if you're viewing the correct apiary
2. Verify filters are not excluding the data you're looking for
3. Check if another user may have modified the data

### Can't Add or Edit Records

If you can't create or modify records:

1. Ensure you're logged in with an account that has appropriate permissions
2. Check if the form has validation errors (look for red error messages)
3. Verify the backend logs for any error messages:
   ```bash
   docker-compose logs backend
   ```

## Backup and Recovery

### Creating a Database Backup

To back up your Hive-Pal data:

```bash
docker exec -t postgres pg_dump -U postgres -d beekeeper > beekeeper_backup_$(date +%Y%m%d).sql
```

### Restoring from Backup

To restore from a backup:

```bash
# Stop the containers
docker-compose down

# Start just the database
docker-compose up -d postgres

# Wait for PostgreSQL to start
sleep 10

# Restore the database
cat your_backup_file.sql | docker exec -i postgres psql -U postgres -d beekeeper

# Start the remaining services
docker-compose up -d
```

## Getting Additional Help

If you continue experiencing issues:

1. Check the [GitHub repository](https://github.com/martinhrvn/hive-pal) for known issues
2. Submit a detailed bug report including:
   - Steps to reproduce the issue
   - Expected behavior
   - Actual behavior
   - Docker and environment information
   - Relevant logs