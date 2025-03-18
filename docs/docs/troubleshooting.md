---
sidebar_position: 3
---

# Troubleshooting

This guide addresses common issues you might encounter while using Hive-Pal.

## Installation Issues

### Docker Container Won't Start

If your Docker containers fail to start:

1. Check if the required ports (80, 3001, 5432) are available:
   ```bash
   sudo lsof -i :80
   sudo lsof -i :3001
   sudo lsof -i :5432
   ```

2. Verify your Docker and Docker Compose installation:
   ```bash
   docker --version
   docker-compose --version
   ```

3. Check container logs for errors:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   docker-compose logs postgres
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
   docker exec -it postgres psql -U postgres -d hivepal
   ```

## Login Issues

### Can't Create Admin Account

If you're having trouble with the initial admin account:

1. Verify that the `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables are set correctly
2. Check the backend logs for any error messages:
   ```bash
   docker-compose logs backend
   ```
3. Try restarting the backend container:
   ```bash
   docker-compose restart backend
   ```

### Login Authentication Failures

If you can't log in with valid credentials:

1. Check that you're using the correct username/password combination
2. Verify the `JWT_SECRET` environment variable is set correctly
3. Clear your browser cookies and cache
4. Check the backend logs for authentication errors:
   ```bash
   docker-compose logs backend | grep auth
   ```

## Performance Issues

### Slow Page Loading

If the application is running slowly:

1. Check your server's resources (CPU, memory, disk space)
2. Consider allocating more resources to Docker if available
3. Check for excessive database growth:
   ```bash
   docker exec -it postgres psql -U postgres -d hivepal -c "SELECT pg_size_pretty(pg_database_size('hivepal'));"
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
docker exec -t postgres pg_dump -U postgres -d hivepal > hivepal_backup_$(date +%Y%m%d).sql
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
cat your_backup_file.sql | docker exec -i postgres psql -U postgres -d hivepal

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