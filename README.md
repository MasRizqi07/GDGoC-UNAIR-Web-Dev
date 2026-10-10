# GDGoC UNAIR Web-Dev

Production-ready interactive web development curriculum platform and full-stack application.

## Architecture

- **Frontend (`apps/web`):** Vanilla JavaScript, WCAG AA accessible components, responsive design token architecture, bundled with Vite for production distribution.
- **Backend (`apps/api`):** NestJS modular API, Prisma ORM, PostgreSQL database, JWT authentication with HttpOnly cookies, CSP headers, rate-limiting, and compression.
- **Contracts (`packages/contracts`):** Shared TypeScript contracts and Zod validation schemas shared end-to-end between client and server.

---

## Environment Variables Matrix

| Variable | Required | Default / Example | Purpose & Production Constraints |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Runtime mode (`development`, `production`, `test`). In production, triggers strict security validations. |
| `PORT` | No | `3000` | Port for the NestJS API HTTP server. |
| `DATABASE_URL` | **Yes** | `postgresql://...` | Connection URL for PostgreSQL. In production, cannot contain default `dev:devpassword`, `127.0.0.1`, or `localhost`. |
| `TEST_DATABASE_URL` | For tests | `postgresql://.../gdgoc_test` | Dedicated PostgreSQL test database URL. Must end with `_test` suffix. |
| `JWT_SECRET` | **Yes** | 32+ char secret | HMAC key for signing JWT tokens. Must be >= 32 characters and cannot match known placeholders. |
| `FRONTEND_URL` | Prod only | `https://yourdomain.com` | Allowed origin for CORS and Origin check. Mandatory in production. |
| `COOKIE_SECURE` | Prod only | `true` (prod) / `false` (dev) | Sets `Secure` flag on authentication cookies. Must be `true` in production. |
| `THROTTLE_LIMIT` | No | `100` | Max requests per minute per IP for global throttler. |
| `AUTH_LOGIN_THROTTLE_LIMIT` | No | `5` | Max login attempts per minute per IP. |
| `POSTGRES_USER` | Docker | `dev` | Database username for Docker Compose service. |
| `POSTGRES_PASSWORD` | Docker | `devpassword` | Database password for Docker Compose service. |
| `POSTGRES_DB` | Docker | `gdgoc` | Database name for Docker Compose service. |

---

## Quick Start (Development)

### Prerequisites
- Node.js 22 LTS
- Docker Desktop (with Docker Compose)

### 1. Setup Environment
```bash
cp .env.example .env
# Edit .env as appropriate
```

### 2. Start PostgreSQL Container
```bash
docker compose up -d db
```

### 3. Install Dependencies & Run Migrations
```bash
npm install
npx prisma migrate dev --name init
```

### 4. Build and Run Dev
```bash
npm run build
npm run dev
```
Access the application at `http://localhost:3000`.

---

## Testing & Verification

- **Full Test Suite:** `npm test`
- **End-to-End Playwright Tests:** `npx playwright test`
- **API Integration Tests:** `npm run test:e2e --workspace=apps/api`
- **Machine Verification Gate:** `npm run verify -- --stage <id>` (or `--all`)

---

## Docker & Production Deployment

### Multi-Stage Docker Build
The root `Dockerfile` uses a multi-stage build pinned to `node:22-alpine` running as a non-privileged `node` user with a container health check:

```bash
# Build production image
npm run build --workspace=apps/web
docker build -t gdgoc-app:latest .

# Run with Docker Compose (prod-like profile)
docker compose --profile prod-like up -d
```

### Production Health Check
The application exposes a health check endpoint:
```bash
curl -f http://localhost:3000/api/v1/health
```

---

## Database Migrations & Rollback Procedures

### Applying Migrations
In production / container environments:
```bash
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

### Backup & Restore (Disaster Recovery Drill)
```bash
# 1. Create database dump
docker exec <db-container> pg_dump -U <user> -d <dbname> > backup.sql

# 2. Restore database from dump
docker exec -i <db-container> psql -U <user> -d <dbname> < backup.sql
```

### Rollback Strategy
1. **Zero-downtime backwards compatible migrations:** Schema changes must be additive (add column nullable/with default first, deploy code, then deprecate old column).
2. **Reverting a migration:**
   - Create a compensating migration with `npx prisma migrate dev --name revert_<feature>`.
   - Apply the compensating migration with `npx prisma migrate deploy`.
   - Re-deploy previous application image.
