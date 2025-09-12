---
sidebar_position: 3
title: Manual Installation
---

# Manual Installation

Set up Hive-Pal without Docker for more control over the environment.

## Prerequisites

### System Dependencies
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm postgresql postgresql-contrib git

# macOS
brew install node postgresql git

# Windows
# Use official installers for Node.js, PostgreSQL
```

### Node.js Setup
```bash
# Install pnpm
npm install -g pnpm

# Verify versions
node --version  # Should be 18+
pnpm --version
```

## Database Setup

### PostgreSQL Installation
```sql
-- Create database and user
CREATE DATABASE hivepal;
CREATE USER hivepal_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE hivepal TO hivepal_user;
```

### Configuration
```bash
# Edit postgresql.conf
listen_addresses = 'localhost'
port = 5432

# Edit pg_hba.conf
local   hivepal    hivepal_user                     md5
host    hivepal    hivepal_user    127.0.0.1/32     md5
```

## Application Setup

### Clone Repository
```bash
git clone https://github.com/martinhrvn/hive-pal.git
cd hive-pal
```

### Install Dependencies
```bash
# Install all packages
pnpm install

# Verify workspace structure
pnpm list --depth=0
```

### Environment Configuration
```bash
# Backend environment
cd apps/backend
cp .env.example .env

# Frontend environment  
cd ../frontend
cp .env.example .env
```

### Database Migration
```bash
# From backend directory
pnpm prisma generate
pnpm prisma migrate dev
pnpm seed  # Optional test data
```

## Development Setup

### Start Services
```bash
# Terminal 1: Backend
cd apps/backend
pnpm dev

# Terminal 2: Frontend
cd apps/frontend  
pnpm dev

# Terminal 3: Database (if needed)
sudo service postgresql start
```

### Verify Installation
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API Docs: http://localhost:3000/api-docs

## Production Setup

### Build Applications
```bash
# Build all packages
pnpm build

# Production dependencies only
pnpm install --prod
```

### Process Manager
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
# ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'hive-pal-backend',
      script: './apps/backend/dist/main.js',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}

# Start with PM2
pm2 start ecosystem.config.js
```

### Web Server Setup
```nginx
# nginx configuration
server {
    listen 80;
    server_name your-domain.com;
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
    
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

## Security

### SSL Certificate
```bash
# Using Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Firewall
```bash
# UFW rules
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## Monitoring

### System Monitoring
```bash
# Install monitoring tools
npm install -g htop iotop

# Check processes
pm2 status
pm2 logs
```

### Database Monitoring
```sql
-- Check connections
SELECT * FROM pg_stat_activity;

-- Monitor performance
SELECT * FROM pg_stat_database;
```

## Backup

### Automated Backups
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U hivepal_user hivepal > backups/hivepal_$DATE.sql
tar -czf backups/uploads_$DATE.tar.gz uploads/

# Add to crontab
0 2 * * * /path/to/backup.sh
```

## Updates

### Application Updates
```bash
# Pull changes
git pull origin main

# Update dependencies
pnpm install

# Run migrations
cd apps/backend
pnpm prisma migrate deploy

# Rebuild
pnpm build

# Restart services
pm2 restart all
```

## Troubleshooting

### Common Issues
- **Port already in use**: Check with `netstat -tlnp`
- **Database connection**: Verify credentials and service
- **Permission errors**: Check file ownership
- **Memory issues**: Monitor with `htop`

### Log Locations
- Application logs: `~/.pm2/logs/`
- System logs: `/var/log/`
- Database logs: `/var/log/postgresql/`