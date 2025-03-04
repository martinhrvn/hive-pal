#!/bin/sh
set -e

# Replace placeholders with environment variables
envsubst < /usr/share/nginx/html/env.js.template > /usr/share/nginx/html/env.js

# Execute the CMD
exec "$@"