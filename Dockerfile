# syntax=docker/dockerfile:1

# Stage 1: Base
FROM node:22-alpine AS base
RUN corepack enable
# Keep in sync with the `turbo` devDependency in the root package.json.
RUN npm i -g turbo@2.11.10 --ignore-scripts
WORKDIR /app

# Stage 2: Prune monorepo
# `out/all` keeps dev dependencies for the build; `out/backend` contains just
# the backend and its workspace dependencies for the production install.
FROM base AS pruner
COPY . .
RUN turbo prune backend frontend --docker --out-dir out/all \
 && turbo prune backend --docker --out-dir out/backend

# Stage 3: Build
FROM base AS builder

COPY --from=pruner /app/out/all/json/ .
COPY --from=pruner /app/out/all/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY --from=pruner /app/out/all/full/ .
COPY turbo.json turbo.json

RUN pnpm --filter backend exec prisma generate
RUN pnpm turbo run build --filter=frontend... --filter=backend...

# Stage 4: Production dependencies
# Installed from the backend-only prune so the runtime image does not carry
# frontend, test or build tooling.
FROM base AS prod-deps
COPY --from=pruner /app/out/backend/json/ .
COPY pnpm-lock.prod.yaml ./pnpm-lock.yaml
COPY scripts/strip-dev-dependencies.mjs ./strip-dev-dependencies.mjs
# Match the production lockfile (it is generated with auto-install-peers off)
# and remove devDependencies from the pruned manifests before installing.
RUN printf 'auto-install-peers=false\n' > .npmrc \
 && node ./strip-dev-dependencies.mjs /app
# Lifecycle scripts are skipped during installation. bcrypt is the one native
# module the server needs, so rebuild it explicitly from the locked version.
# Then drop files that are only used for development: source maps, type
# declarations and package docs are never read at runtime (the TypeScript
# compiler's own lib files are kept in case the Prisma config loader needs them).
RUN pnpm install --prod --frozen-lockfile --ignore-scripts \
 && pnpm rebuild bcrypt \
 # The Prisma schema targets PostgreSQL only.
 && find node_modules -path '*/@prisma/client/runtime/query_compiler_*' ! -name '*postgresql*' -delete \
 # Alpine uses musl; drop the glibc builds that pnpm installs alongside.
 && find node_modules/.pnpm -maxdepth 1 -type d -name '*-linux-x64-gnu*' -exec rm -rf {} + \
 && rm -rf node_modules/.pnpm/@img+sharp-libvips-linux-x64@* node_modules/.pnpm/@img+sharp-linux-x64@* \
 && find node_modules -type f \( -name '*.map' -o -name '*.d.ts' -o -name '*.d.mts' -o -name '*.md' \) \
      ! -path '*/typescript/lib/*' -delete \
 && find node_modules -type f -name '*.ts' ! -name '*.d.ts' -delete

# Stage 5: Production
FROM node:22-alpine AS production
RUN apk add --no-cache netcat-openbsd \
 # npm, yarn and corepack are not needed to run the server.
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-v1.22.22
WORKDIR /app

ENV NODE_ENV=production

COPY --from=prod-deps /app/ ./

# Compiled backend (including the generated Prisma client) and its migrations.
COPY --from=builder /app/apps/backend/dist/ ./apps/backend/dist/
COPY --from=builder /app/apps/backend/prisma/ ./apps/backend/prisma/
COPY --from=builder /app/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts
COPY --from=builder /app/packages/shared-schemas/dist/ ./packages/shared-schemas/dist/

# Frontend build output served by the backend
COPY --from=builder /app/apps/frontend/dist/client/ ./apps/backend/dist/static/

RUN mkdir -p /data/uploads

COPY apps/backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "apps/backend/dist/src/main.js"]
