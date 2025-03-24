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
COPY apps/backend ./apps/backend
RUN turbo run build --filter=backend...

# Stage 2: Production
FROM node:22-alpine as production
#
WORKDIR /app

COPY --from=builder /app/apps/backend/dist /app/
COPY --from=builder /app/apps/backend/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules
CMD ["node", "src/main.js"]