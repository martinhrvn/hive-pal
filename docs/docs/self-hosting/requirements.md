---
sidebar_position: 1
title: System Requirements
---

# System Requirements

Minimum and recommended specifications for self-hosting Hive-Pal.

## Minimum Requirements

### Hardware
- **CPU**: 2 cores
- **RAM**: 2 GB
- **Storage**: 10 GB
- **Network**: Stable internet connection

### Software
- **OS**: Linux, macOS, or Windows
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Node.js**: Version 18+ (for manual setup)
- **PostgreSQL**: Version 14+ (for manual setup)

## Recommended Specifications

### Hardware
- **CPU**: 4+ cores
- **RAM**: 4+ GB
- **Storage**: 20+ GB SSD
- **Network**: Broadband connection

### For Production
- **CPU**: 4-8 cores
- **RAM**: 8+ GB
- **Storage**: 50+ GB SSD
- **Backup**: Automated backup solution
- **SSL**: Valid SSL certificate

## User Capacity

### Small (1-10 users)
- Minimum requirements sufficient
- Single server setup
- SQLite or PostgreSQL

### Medium (10-50 users)
- Recommended specifications
- PostgreSQL required
- Consider Redis for caching

### Large (50+ users)
- Dedicated database server
- Load balancing
- CDN for static assets
- Monitoring infrastructure

## Network Requirements

### Ports
- **3000**: Backend API
- **5173**: Frontend (development)
- **5432**: PostgreSQL
- **80/443**: Web traffic

### Bandwidth
- **Per user**: ~1 MB/day average
- **Peak usage**: During sync operations
- **Images**: Consider storage impact

## Browser Support

### Desktop
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile
- iOS Safari 14+
- Chrome Mobile
- Firefox Mobile

## Additional Considerations

- Regular backups essential
- SSL certificate required for production
- Domain name recommended
- Email service for notifications