---
sidebar_position: 6
title: Monitoring
---

# Monitoring

Monitor your Hive-Pal installation with comprehensive logging and metrics.

## Health Monitoring

### Application Health
```bash
# Health check endpoint
curl http://localhost:3000/health

# Response format
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 3600,
  "database": "connected",
  "version": "1.0.0"
}
```

### Database Health
```sql
-- Connection status
SELECT count(*) FROM pg_stat_activity;

-- Database size
SELECT pg_size_pretty(pg_database_size('hivepal'));

-- Table statistics
SELECT schemaname,tablename,n_tup_ins,n_tup_upd,n_tup_del 
FROM pg_stat_user_tables;
```

## Logging

### Application Logs
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "info",
  "message": "User login successful",
  "userId": "123",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

### Log Aggregation
```bash
# Using journalctl
journalctl -u hive-pal -f

# Using Docker
docker-compose logs -f backend

# Custom log parser
tail -f /var/log/hive-pal/app.log | jq '.'
```

## Metrics Collection

### Prometheus Integration
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'hive-pal'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: /metrics
    scrape_interval: 15s
```

### Key Metrics
- Request count and duration
- Database query performance  
- Memory and CPU usage
- Error rates
- User session duration

## Grafana Dashboards

### System Metrics
- CPU usage
- Memory consumption
- Disk I/O
- Network traffic

### Application Metrics
- API response times
- Database connections
- User activity
- Error rates

### Business Metrics
- User registrations
- Inspection records
- Data growth

## Alerting

### Alert Rules
```yaml
# alerts.yml
groups:
  - name: hive-pal
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected

      - alert: DatabaseConnections
        expr: pg_stat_activity_count > 80
        for: 2m
        labels:
          severity: warning
```

### Notification Channels
- Email alerts
- Slack integration
- Webhook notifications
- SMS alerts (via services)

## Log Management

### Log Rotation
```bash
# logrotate configuration
/var/log/hive-pal/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 hive-pal hive-pal
    postrotate
        systemctl reload hive-pal
    endscript
}
```

### Centralized Logging
```yaml
# docker-compose with Loki
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    
  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log:ro
      - ./promtail-config.yml:/etc/promtail/config.yml
```

## Performance Monitoring

### Database Performance
```sql
-- Slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage
SELECT schemaname,tablename,attname,n_distinct,correlation
FROM pg_stats
WHERE tablename = 'inspections';
```

### Application Performance
```bash
# Memory usage
ps aux | grep hive-pal

# File descriptor usage
lsof -p $(pgrep -f hive-pal) | wc -l

# Network connections
netstat -an | grep :3000
```

## Security Monitoring

### Access Logs
- Failed login attempts
- Suspicious IP addresses
- Unusual access patterns
- API abuse detection

### Security Alerts
```bash
# Monitor failed logins
tail -f /var/log/hive-pal/app.log | grep "login failed"

# Check for brute force attempts
grep "authentication failed" /var/log/hive-pal/app.log | \
  awk '{print $4}' | sort | uniq -c | sort -nr
```

## Troubleshooting

### Common Issues
- High memory usage
- Database connection limits
- Disk space exhaustion  
- SSL certificate expiration

### Debug Tools
```bash
# Process monitoring
htop
iotop

# Network debugging
tcpdump -i eth0 port 3000

# Database debugging
pg_stat_activity
pg_locks
```

## Monitoring Best Practices

### Metrics Strategy
- Monitor what matters
- Set meaningful thresholds
- Avoid alert fatigue
- Regular review and tuning

### Log Management
- Structured logging
- Appropriate log levels
- Log retention policies
- Security considerations

### Performance Tuning
- Regular performance reviews
- Capacity planning
- Bottleneck identification
- Optimization implementation