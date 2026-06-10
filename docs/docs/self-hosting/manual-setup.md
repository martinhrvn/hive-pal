---
sidebar_position: 3
title: Manual Setup
description: Run Hive-Pal from source without Docker using the PNPM/Turborepo monorepo — for development and customization.
keywords: [manual installation, hive-pal from source, pnpm, turborepo, nodejs setup, postgresql]
---

# Manual Setup

Running from source is intended for **development and customization**. For production self-hosting, the [single-container Docker setup](./docker-setup) is strongly recommended — it builds the frontend and backend together and runs migrations for you.

## Prerequisites

- **Node.js 22+**
- **PNPM** (`npm install -g pnpm`)
- **PostgreSQL 14+** (or use the bundled Docker database — see below)

## 1. Clone and Install

```bash
git clone https://github.com/martinhrvn/hive-pal.git
cd hive-pal
pnpm install
```

This is a PNPM workspace managed by Turborepo. The app lives in `apps/frontend` and `apps/backend`; shared Zod schemas are in `packages/shared-schemas`.

## 2. Database

The quickest way to get a database is the bundled Docker compose helper:

```bash
cd apps/backend
pnpm db:up          # starts PostgreSQL in Docker
```

Or point `DATABASE_URL` at any existing PostgreSQL 14+ instance.

## 3. Configure Environment

Create `apps/backend/.env` (and `apps/frontend/.env` for the dev server). At minimum the backend needs:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/beekeeper?schema=public"
BETTER_AUTH_SECRET=replace_me_with_a_random_string   # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=changeme123
```

See [Configuration](./configuration) for the full list. For the frontend dev server set `VITE_API_URL=http://localhost:3000` in `apps/frontend/.env`.

## 4. Generate Client and Run Migrations

From `apps/backend`:

```bash
pnpm prisma:generate   # generate the Prisma client
prisma migrate dev     # apply migrations to the database
pnpm seed              # optional: seed test data
```

## 5. Start the App

From the repository root:

```bash
pnpm dev
```

This starts both services:

- **Frontend** — `http://localhost:5173`
- **Backend API** — `http://localhost:3000/api`
- **API docs (Swagger)** — `http://localhost:3000/api-docs`

## Building for Production

To produce production builds without Docker:

```bash
turbo build
```

In production the backend serves the frontend's static build from its own `static/` directory (the same arrangement the Docker image uses). You'll need a process manager and reverse proxy to run it reliably — at which point the [Docker image](./docker-setup) does all of this for you, so prefer it unless you have a specific reason not to.

## Updating

```bash
git pull origin main
pnpm install
cd apps/backend && pnpm prisma migrate deploy
turbo build
```
