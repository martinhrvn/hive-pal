#!/bin/bash

# Replace the placeholder in prometheus.yml with the actual API key
sed -i "s|\${PROMETHEUS_API_KEY}|${PROMETHEUS_API_KEY}|g" /etc/prometheus/prometheus.yml

# Start Prometheus
exec /prometheus "$@"