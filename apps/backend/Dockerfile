# Stage 1: Build
FROM node:22-alpine AS builder

# Enable corepack (pnpm)
RUN corepack enable

WORKDIR /app

# Copy pnpm workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy backend and shared packages' package.json files
COPY apps/backend/package.json ./apps/backend/
# If shared packages exist, add their package.json here too

# Install dependencies (only for the backend)
RUN pnpm --filter backend --frozen-lockfile install

# Copy source code
COPY apps/backend ./apps/backend
# COPY packages/shared ./packages/shared  # If shared packages exist
RUN pnpm --filter backend exec prisma generate

# Build the backend
RUN pnpm --filter backend build
RUN pnpm --filter backend --prod deploy pruned
RUN ls -l pruned

# Stage 2: Production
FROM node:18-alpine
#
WORKDIR /app

# Copy dependencies and built code
COPY --from=builder /app/pruned .
COPY --from=builder /app/apps/backend/dist .
RUN ls -l .
CMD ["node", "src/main.js"]