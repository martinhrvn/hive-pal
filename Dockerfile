# Stage 1: Base
FROM node:22-alpine AS base
RUN corepack enable
RUN npm i -g turbo
WORKDIR /app

# Stage 2: Prune monorepo
FROM base AS pruner
COPY . .
RUN turbo prune --scope=backend --scope=frontend --docker

# Stage 3: Build
FROM base AS builder

ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_ENVIRONMENT

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

RUN pnpm --filter backend exec prisma generate
RUN turbo run build --filter=frontend... --filter=backend...

# Stage 4: Production
FROM node:22-alpine AS production
RUN apk add --no-cache netcat-openbsd
WORKDIR /app

COPY --from=builder /app/ /app/

# Copy frontend build output into backend's static directory
RUN cp -r /app/apps/frontend/dist /app/apps/backend/dist/static

COPY apps/backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "apps/backend/dist/src/main.js"]
