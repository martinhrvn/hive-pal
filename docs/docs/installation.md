---
sidebar_position: 2
---

# Installation Guide

This guide will walk you through the process of installing and configuring Hive-Pal on your own server.

## Prerequisites

Before you begin, ensure you have the following installed on your server:

- Docker and Docker Compose
- Node.js 18+ (for development only)
- PNPM package manager (for development only)

## Docker Installation (Recommended)

The simplest way to run Hive-Pal is using Docker and Docker Compose.

### 1. Create a docker-compose.yml file

Create a `docker-compose.yml` file with the following content (or use the one provided in the repository):

```yaml
version: '3'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: hivepal
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    image: ghcr.io/martinhrvn/hive-pal-backend:latest
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/hivepal
      JWT_SECRET: your-secret-key-change-me
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: securepassword
    ports:
      - "3001:3001"

  frontend:
    image: ghcr.io/martinhrvn/hive-pal-frontend:latest
    ports:
      - "80:80"
    environment:
      VITE_API_URL: http://localhost:3001

volumes:
  postgres-data:
```

### 2. Start the application

Run the following command to start Hive-Pal:

```bash
docker-compose up -d
```

This will pull the required images and start the application.

### 3. Access the application

Once the containers are running, you can access Hive-Pal at:

```
http://localhost
```

Use the admin credentials you set in the environment variables to log in for the first time.

## Environment Variables

The following environment variables can be configured:

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@postgres:5432/hivepal` |
| `JWT_SECRET` | Secret key for JWT token generation | *Required* |
| `ADMIN_USERNAME` | Default admin username | `admin` |
| `ADMIN_PASSWORD` | Default admin password | *Required* |
| `PORT` | Port the backend will listen on | `3001` |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | URL to the backend API | `http://localhost:3001` |

## Manual Installation (Development)

For development purposes, you can run Hive-Pal without Docker:

```bash
# Clone the repository
git clone https://github.com/martinhrvn/hive-pal.git

# Install dependencies
cd hive-pal
pnpm install

# Start the development servers
pnpm dev
```

This will start both the frontend and backend development servers.

## Updating Hive-Pal

To update to the latest version:

```bash
# Pull the latest images
docker pull ghcr.io/martinhrvn/hive-pal-frontend:latest
docker pull ghcr.io/martinhrvn/hive-pal-backend:latest

# Restart the containers
docker-compose down
docker-compose up -d
```