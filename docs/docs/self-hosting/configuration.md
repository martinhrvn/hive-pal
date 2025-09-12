---
sidebar_position: 4
title: Configuration
---

# Configuration

Complete reference for configuring your Hive-Pal installation.

## Environment Variables

### Backend Configuration

#### Database
```bash
DATABASE_URL="postgresql://user:password@host:port/database"
```

#### Security
```bash
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

#### Optional Services
```bash
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Error Tracking
SENTRY_DSN=your_sentry_dsn_here

# File Storage
UPLOAD_PATH=/uploads
MAX_FILE_SIZE=10485760  # 10MB
```

### Frontend Configuration

#### API Connection
```bash
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=30000
```

#### Optional Features
```bash
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
VITE_WEATHER_API_KEY=your_weather_api_key
```

## Database Configuration

### Connection Pool
```bash
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=10000
DB_POOL_ACQUIRE_TIMEOUT=60000
```

### Performance Tuning
```sql
-- postgresql.conf optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
random_page_cost = 1.1
```

## Security Settings

### HTTPS Configuration
```bash
# Force HTTPS
FORCE_HTTPS=true
HSTS_MAX_AGE=31536000

# CORS Settings
CORS_CREDENTIALS=true
CORS_MAX_AGE=86400
```

### Rate Limiting
```bash
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100        # requests per window
```

## File Storage

### Local Storage
```bash
UPLOAD_PATH=/var/lib/hive-pal/uploads
TEMP_PATH=/tmp/hive-pal
```

### Cloud Storage (Optional)
```bash
# AWS S3
AWS_REGION=us-west-2
AWS_BUCKET=hive-pal-uploads
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Alternative: MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=your_key
MINIO_SECRET_KEY=your_secret
```

## Logging

### Log Levels
```bash
LOG_LEVEL=info  # error, warn, info, debug
LOG_FORMAT=json # json, simple
LOG_FILE=/var/log/hive-pal/app.log
```

### External Logging
```bash
# Loki
LOKI_URL=http://localhost:3100
LOKI_USERNAME=admin
LOKI_PASSWORD=admin
```

## Monitoring

### Health Checks
```bash
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_PATH=/health
```

### Metrics
```bash
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
METRICS_PATH=/metrics
```

## Email Configuration

### SMTP Settings
```bash
MAIL_FROM=noreply@your-domain.com
MAIL_FROM_NAME="Hive-Pal"
MAIL_REPLY_TO=support@your-domain.com
```

### Email Templates
- Welcome email
- Password reset
- Inspection reminders
- System notifications

## API Configuration

### Rate Limiting
```bash
API_RATE_LIMIT=1000  # requests per hour
API_BURST_LIMIT=50   # burst requests
```

### Timeouts
```bash
API_TIMEOUT=30000     # 30 seconds
DB_TIMEOUT=10000      # 10 seconds
UPLOAD_TIMEOUT=300000 # 5 minutes
```

## Cache Configuration

### Redis (Optional)
```bash
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600        # 1 hour
REDIS_KEY_PREFIX=hive-pal:
```

### Memory Cache
```bash
CACHE_MAX_SIZE=100    # MB
CACHE_TTL=1800        # 30 minutes
```

## Backup Configuration

### Database Backups
```bash
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
BACKUP_RETENTION=30          # Days
BACKUP_PATH=/backups
```

### File Backups
```bash
FILE_BACKUP_ENABLED=true
FILE_BACKUP_SCHEDULE="0 3 * * *"
FILE_BACKUP_COMPRESSION=true
```

## Development Settings

### Debug Mode
```bash
NODE_ENV=development
DEBUG=true
VERBOSE_LOGGING=true
```

### Hot Reload
```bash
WATCH_MODE=true
RELOAD_ON_CHANGE=true
```

## Production Optimizations

### Performance
```bash
NODE_ENV=production
COMPRESSION_ENABLED=true
GZIP_LEVEL=6
STATIC_CACHE_TTL=31536000  # 1 year
```

### Security
```bash
HELMET_ENABLED=true
CSP_ENABLED=true
SECURE_COOKIES=true
```

## Configuration Validation

### Required Variables
- DATABASE_URL
- JWT_SECRET
- ALLOWED_ORIGINS

### Optional Variables
- All other settings have defaults
- Override as needed
- Environment-specific files supported

## Best Practices

- Use environment-specific .env files
- Never commit secrets to version control
- Use Docker secrets in production
- Validate configuration on startup
- Monitor configuration changes