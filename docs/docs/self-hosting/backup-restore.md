---
sidebar_position: 5
title: Backup & Restore
description: Set up automated database backups and learn how to restore your Hive-Pal beekeeping data reliably.
keywords: [hive-pal backup, database backup, data restore, postgresql backup, beekeeping data]
---

# Backup & Restore

Protect your beekeeping data with reliable backup and restore procedures.

## Automated Backups

### Database Backups
```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
mkdir -p $BACKUP_DIR

# PostgreSQL backup
pg_dump -U postgres beekeeper | gzip > $BACKUP_DIR/beekeeper_$DATE.sql.gz

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### File Backups
```bash
#!/bin/bash  
# backup-files.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/files"
UPLOAD_DIR="/data/uploads"

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $UPLOAD_DIR .
```

### Cron Scheduling
```bash
# Add to crontab
crontab -e

# Database backup daily at 2 AM
0 2 * * * /scripts/backup-db.sh

# File backup daily at 3 AM  
0 3 * * * /scripts/backup-files.sh

# Weekly full backup
0 1 * * 0 /scripts/backup-full.sh
```

## Manual Backups

### Database Export
```bash
# Full database
pg_dump -U postgres -h localhost beekeeper > backup.sql

# Schema only
pg_dump -U postgres -h localhost --schema-only beekeeper > schema.sql

# Data only
pg_dump -U postgres -h localhost --data-only beekeeper > data.sql
```

### Specific Tables
```bash
# Backup specific tables
pg_dump -U postgres -h localhost -t users -t apiaries beekeeper > partial.sql
```

### Files Export
```bash
# Copy upload directory
cp -r /data/uploads /backups/uploads_backup

# Create compressed archive
tar -czf uploads_backup.tar.gz uploads/
```

## Docker Backups

### Container Data
```bash
# Database container backup
docker-compose exec postgres pg_dump -U postgres beekeeper > backup.sql

# Volume backup
docker run --rm -v hive-pal_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz /data
```

### Full Stack Backup
```bash
# Stop containers
docker-compose down

# Backup volumes
docker run --rm -v hive-pal_postgres_data:/postgres -v hive-pal_uploads:/uploads -v $(pwd):/backup alpine tar czf /backup/full_backup.tar.gz /postgres /uploads

# Restart
docker-compose up -d
```

## Restore Procedures

### Database Restore
```bash
# Drop and recreate database
dropdb -U postgres beekeeper
createdb -U postgres beekeeper

# Restore from backup
psql -U postgres beekeeper < backup.sql

# Or from compressed backup
gunzip -c backup.sql.gz | psql -U postgres beekeeper
```

### Partial Restore
```bash
# Restore specific tables
psql -U postgres beekeeper < partial_backup.sql

# Restore with conflict handling
psql -U postgres beekeeper -c "TRUNCATE TABLE users CASCADE;"
psql -U postgres beekeeper < users_backup.sql
```

### File Restore
```bash
# Restore uploads directory
rm -rf /data/uploads
tar -xzf uploads_backup.tar.gz -C /var/lib/hive-pal/

# Set permissions
chown -R hive-pal:hive-pal /data/uploads
chmod -R 755 /data/uploads
```

### Docker Restore
```bash
# Stop containers
docker-compose down

# Restore volumes
docker run --rm -v hive-pal_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_data.tar.gz -C /

# Start containers (migrations run automatically on startup)
docker compose up -d
```

## Cloud Backups

### AWS S3
```bash
# Install AWS CLI
aws configure

# Upload backup
aws s3 cp backup.sql.gz s3://your-backup-bucket/hive-pal/$(date +%Y%m%d)/

# Download backup
aws s3 cp s3://your-backup-bucket/hive-pal/20241201/backup.sql.gz .
```

### Google Cloud Storage
```bash
# Install gcloud
gcloud auth login

# Upload
gsutil cp backup.sql.gz gs://your-backup-bucket/hive-pal/

# Download  
gsutil cp gs://your-backup-bucket/hive-pal/backup.sql.gz .
```

## Monitoring Backups

### Backup Verification
```bash
#!/bin/bash
# verify-backup.sh

# Check if backup file exists and is recent
BACKUP_FILE="/backups/database/$(date +%Y%m%d)_*.sql.gz"
if [ ! -f $BACKUP_FILE ]; then
    echo "ERROR: No backup found for today"
    exit 1
fi

# Check backup file size
SIZE=$(stat -f%z $BACKUP_FILE 2>/dev/null || stat -c%s $BACKUP_FILE)
if [ $SIZE -lt 1000000 ]; then  # Less than 1MB
    echo "WARNING: Backup file seems too small"
fi

echo "Backup verification complete"
```

### Automated Testing
```bash
# Test restore process
createdb test_restore
gunzip -c backup.sql.gz | psql test_restore
dropdb test_restore
```

## Disaster Recovery

### Recovery Planning
1. **Identify critical data**
2. **Set recovery time objectives (RTO)**
3. **Set recovery point objectives (RPO)**
4. **Document procedures**
5. **Test regularly**

### Emergency Procedures
```bash
# Quick restore checklist
# 1. Stop application
sudo systemctl stop hive-pal

# 2. Restore database
dropdb beekeeper && createdb beekeeper
psql beekeeper < latest_backup.sql

# 3. Restore files
tar -xzf latest_files_backup.tar.gz -C /var/lib/hive-pal/

# 4. Start application
sudo systemctl start hive-pal
```

## Best Practices

### Backup Strategy
- **3-2-1 Rule**: 3 copies, 2 different media, 1 offsite
- **Regular schedule**: Daily database, weekly files
- **Test restores**: Monthly verification
- **Monitor success**: Automated alerts

### Security
- Encrypt backup files
- Secure storage locations
- Access control
- Audit backup access

### Documentation
- Keep recovery procedures updated
- Document backup locations
- Maintain restore checklists
- Train team members

### Automation
- Use configuration management
- Monitor backup jobs
- Alert on failures
- Verify backup integrity