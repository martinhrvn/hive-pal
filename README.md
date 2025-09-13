# Hive Pal 🐝

[![Tests](https://github.com/martinhrvn/hive-pal/actions/workflows/check.yml/badge.svg)](https://github.com/martinhrvn/hive-pal/actions/workflows/check.yml)

A modern beekeeping management application designed for both mobile and desktop use. Track your apiaries, hives, inspections, and more with our intuitive interface.

**⚠️ IMPORTANT: This project is very much a Work In Progress. Features may be incomplete or change significantly.**

## Features

- **Apiary Management**: Create and track multiple apiaries with location information
- **Hive Tracking**: Monitor hives, their status, and configuration
- **Inspection Workflows**: Record detailed inspections with observations and actions
- **Queen Management**: Track queen lineage and replacement history
- **Mobile-First Design**: Optimized for field use with easy data entry

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for development only)
- PNPM package manager

### Running with Docker

```bash
# Pull the latest images
docker pull ghcr.io/martinhrvn/hive-pal-frontend:latest
docker pull ghcr.io/martinhrvn/hive-pal-backend:latest

# Start the application
docker-compose up -d
```

### Environment Variables

The application requires the following environment variables:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/hivepal
JWT_SECRET=your-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=securepassword
```

See `.env.example` for additional configuration options.

## Development

```bash
# Clone the repository
git clone https://github.com/martinhrvn/hive-pal.git

# Install dependencies
cd hive-pal
pnpm install

# Start the development server
pnpm dev
```

## Project Structure

```
/apps
  /frontend - React frontend application
  /backend - Node.js backend application
/packages
  /api-client - Generated API client from Swagger
```

## Technology Stack

- **Frontend**: React with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Package Management**: PNPM
- **API Client**: Auto-generated from Swagger
- **Containerization**: Docker

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by beekeepers who needed a better way to track their hives
