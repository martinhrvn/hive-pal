---
sidebar_position: 2
title: Docker Setup
---

# Docker Setup

Deploy Hive-Pal using Docker for the simplest installation.

## Quick Start

```bash
# Clone repository
git clone https://github.com/martinhrvn/hive-pal.git
cd hive-pal

# Copy environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Start services
docker-compose up -d
```

## Environment Configuration

### Backend (.env)
```bash
# Database
DATABASE_URL="postgresql://postgres:password@postgres:5432/hivepal"

# Security
JWT_SECRET=your_jwt_secret_here
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com

# Optional services
SENTRY_DSN=your_sentry_dsn
SMTP_HOST=your_smtp_server
```

### Frontend (.env)
```bash
# API connection
VITE_API_URL=http://localhost:3000

# Optional
VITE_SENTRY_DSN=your_sentry_dsn
```

## Docker Compose Structure

### Services
- **frontend**: React application
- **backend**: NestJS API
- **postgres**: PostgreSQL database
- **redis**: Caching (optional)

### Volumes
- Database persistence
- File uploads
- Configuration files

### Networks
- Internal communication
- External access

## Production Deployment

### SSL Setup
```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
```

### Environment Variables
- Use Docker secrets
- External configuration
- Environment-specific settings

## Monitoring

### Health Checks
- API health endpoint
- Database connectivity
- Service status

### Logs
- Centralized logging
- Log rotation
- Error tracking

## Backup Strategy

### Database Backups
```bash
# Automated backup
docker-compose exec postgres pg_dump -U postgres hivepal > backup.sql
```

### File Backups
- Upload directories
- Configuration files
- SSL certificates

## Updates

### Application Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose build --no-cache

# Update services
docker-compose up -d
```

### Database Migrations
- Automatic on startup
- Manual migration commands
- Backup before updates

## Troubleshooting

### Common Issues
- Port conflicts
- Permission problems
- Database connection errors
- Memory issues

### Debug Commands
```bash
# View logs
docker-compose logs -f service_name

# Execute commands
docker-compose exec backend npm run migrate

# Restart services
docker-compose restart
```