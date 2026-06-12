---
sidebar_position: 6
title: Monitoring
description: Monitor your Hive-Pal installation with health checks, Prometheus metrics, Grafana dashboards, and centralized logging.
keywords: [hive-pal monitoring, prometheus metrics, grafana dashboard, application logging]
---

# Monitoring

Monitor your Hive-Pal installation with comprehensive logging and metrics.

## Health Monitoring

### Application Health
```bash
# Health check endpoint
curl http://localhost:3000/api/health

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
SELECT pg_size_pretty(pg_database_size('beekeeper'));

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
Metrics are served from a dedicated internal port (`METRICS_PORT`, default
`9100`) by a standalone HTTP server — **not** on the public `:3000` API. Keep
this port unpublished and scrape it from a Prometheus instance on the same
Docker network so metrics are never exposed to the internet.

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'hive-pal'
    static_configs:
      - targets: ['backend:9100']
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

## Frontend Observability (Web Vitals)

The React frontend ships **real-user monitoring** with the
[Grafana Faro Web SDK](https://grafana.com/oss/faro/). It automatically captures
Core Web Vitals (LCP, CLS, INP, FCP, TTFB), frontend errors, and session info in
the browser and sends them to a **Grafana Alloy** `faro.receiver`, which forwards
them to your existing **Loki**. Grafana then visualizes p75 per page (the
"Frontend — Web Vitals (Faro)" row in the Hive-Pal dashboard).

```
Browser (Faro Web SDK)
   │  POST /collect   (LCP/CLS/INP/FCP/TTFB, errors)
   ▼
Grafana Alloy (faro.receiver)
   │  logs
   ▼
Loki  ──►  Grafana (LogQL p75 panels)
```

### Enable on the frontend

Set the collector URL so the backend serves it to the browser via `/env.js`:

```bash
# Public URL of the Alloy faro.receiver, reachable from the browser
VITE_FARO_URL=https://collector.example.com/collect
VITE_FARO_ENVIRONMENT=production
```

When `VITE_FARO_URL` is empty, Faro stays disabled (e.g. local dev). Sentry error
tracking is unaffected — Faro is additive.

### Run the Alloy collector

Alloy runs alongside your monitoring stack (Grafana/Prometheus/Loki). The config
is version-controlled at [`alloy/config.alloy`](https://github.com/martinhrvn/hive-pal/blob/main/alloy/config.alloy):

```alloy
faro.receiver "frontend" {
  server {
    listen_address       = "0.0.0.0"
    listen_port          = 12347
    cors_allowed_origins = ["https://your-frontend.example.com"]
  }
  sourcemaps { download = true }
  output { logs = [loki.write.faro.receiver] }
}

loki.write "faro" {
  endpoint { url = "http://loki:3100/loki/api/v1/push" }
  external_labels = { app = "hivepal-frontend" }
}
```

Add it to your monitoring `docker-compose`:

```yaml
services:
  alloy:
    image: grafana/alloy:latest
    command:
      - run
      - /etc/alloy/config.alloy
      - --server.http.listen-addr=0.0.0.0:12345
    volumes:
      - ./alloy/config.alloy:/etc/alloy/config.alloy:ro
    environment:
      ALLOY_FARO_CORS_ORIGINS: https://your-frontend.example.com
      LOKI_PUSH_URL: http://loki:3100/loki/api/v1/push
    ports:
      - "12347:12347"   # Faro receiver — expose publicly (TLS via your proxy)
```

The Faro receiver on `:12347` must be reachable from users' browsers, so expose
it through your reverse proxy with TLS and keep `cors_allowed_origins` tight.
`VITE_FARO_URL` points at `https://<that-host>/collect`.

### Loki datasource

Grafana provisions a Loki datasource at
[`grafana/provisioning/datasources/loki.yml`](https://github.com/martinhrvn/hive-pal/blob/main/grafana/provisioning/datasources/loki.yml)
(`url: http://loki:3100`). Explore frontend telemetry with:

```logql
{app="hivepal-frontend"}                         # all Faro signals
{app="hivepal-frontend"} | logfmt | kind=`measurement`   # Web Vitals
{app="hivepal-frontend"} | logfmt | kind=`exception`     # frontend errors
```

:::note
The dashboard panels unwrap measurement fields named `value_lcp` / `value_inp` /
`value_cls` and group by `view_name`. Field names can vary across Faro/Alloy
versions — inspect a real measurement log line in **Explore** and adjust the panel
queries if your version differs.
:::

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