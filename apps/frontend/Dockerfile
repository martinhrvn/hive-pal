# Stage 1: Build
FROM node:22-alpine AS builder

RUN corepack enable

WORKDIR /app

# Copy pnpm workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy frontend package.json
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/api-client/package.json ./packages/api-client/
# Install dependencies
RUN pnpm --filter frontend install
RUN pnpm --filter api-client install

# Copy source code
COPY apps/frontend ./apps/frontend

COPY packages/api-client ./packages/api-client

# Build the frontend
RUN pnpm --filter frontend build


# Stage 2: Serve with NGINX
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY --from=builder /app/apps/frontend/env.js /usr/share/nginx/html/env.js.template
COPY apps/frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
# NGINX configuration (optional)
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]