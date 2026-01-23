# Stage 1: Build

FROM node:22-alpine AS base
RUN corepack enable
RUN npm i -g turbo
WORKDIR /app

FROM base AS pruner
COPY . .
RUN turbo prune --scope=backend --docker

FROM base AS builder
# Copy pnpm workspace files
COPY --from=pruner /app/out/json .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
# Copy source code
RUN pnpm --filter backend exec prisma generate
RUN turbo run build --filter=backend...
RUN ls -la /app
# Stage 2: Production
FROM node:22-alpine as production
RUN apk add --no-cache netcat-openbsd
WORKDIR /app

COPY --from=builder /app/ /app/
COPY apps/backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "apps/backend/dist/src/main.js"]