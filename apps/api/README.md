# GDGoC UNAIR API (`apps/api`)

Modular RESTful API built with NestJS, Prisma ORM, and PostgreSQL, providing enterprise-grade security and full-stack type safety.

---

## 1. Architecture Overview

The backend is built with NestJS modular architecture, structured cleanly around domain features and infrastructure:

```
apps/api/src/
├── app.module.ts              # Root module configuring config, throttler, and feature modules
├── main.ts                    # Bootstrap entry: Helmet, cookies, global pipes, and filters
├── common/
│   ├── filters/               # Standardized error response filter (AllExceptionsFilter)
│   └── guards/                # Security guards (OriginGuard, ThrottlerBehindProxyGuard)
├── auth/                      # Authentication domain (JWT, cookies, family revocation)
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   └── jwt-auth.guard.ts
├── todos/                     # Todo items domain (CRUD, reordering, ownership checks)
│   ├── todos.controller.ts
│   ├── todos.service.ts
│   └── todos.module.ts
├── health/                    # Production container health probe (/api/v1/health)
│   ├── health.controller.ts
│   └── health.module.ts
└── prisma/                    # Database client provider and lifecycle hooks
    ├── prisma.service.ts
    └── prisma.module.ts
```

---

## 2. Request Lifecycle & Security Middleware

Every incoming HTTP request passes through a strictly ordered pipeline:

1. **Helmet & Security Headers:** Enforces CSP (`script-src 'self'`), `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`.
2. **Compression:** Transparent gzip/deflate response compression.
3. **Cookie Parser:** Extracts `access_token` and `refresh_token` from signed/HttpOnly cookies.
4. **Rate Limiting (`ThrottlerBehindProxyGuard`):** Limits general traffic to 100 req/min per IP and auth endpoints to 5 attempts/min.
5. **Origin Guard (`OriginGuard`):** Blocks cross-origin mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) by validating `Origin` and `Referer` headers against `FRONTEND_URL`.
6. **Validation Pipe (`ZodValidationPipe`):** Validates and normalizes request payloads using shared Zod contracts (`@gdgoc/contracts`).
7. **Authentication Guard (`JwtAuthGuard`):** Validates JWT signature, checks expiration, and attaches user identity to request context.
8. **Exception Filter (`AllExceptionsFilter`):** Formats all exceptions into standardized structured JSON errors (`{ statusCode, message, error }`).

---

## 3. API Endpoints Specification

All endpoints are versioned under `/api/v1`:

### Authentication (`/api/v1/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register new user account; normalizes email and sets cookies. |
| `POST` | `/login` | Public | Authenticates credentials; issues access and refresh cookies. |
| `POST` | `/refresh` | Cookie | Rotates refresh token; detects token reuse and revokes token family. |
| `POST` | `/logout` | Public | Clears authentication cookies and invalidates refresh session. |
| `GET` | `/me` | Bearer/Cookie | Returns profile of the currently authenticated user. |
| `DELETE` | `/account` | Bearer/Cookie | Permanently deletes user account, all todos, and refresh tokens. |

### Todos (`/api/v1/todos`)
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Required | Lists all todos belonging to the authenticated user. |
| `POST` | `/` | Required | Creates a new todo item for the authenticated user. |
| `PATCH` | `/:id` | Required | Updates todo title or completion state (enforces ownership). |
| `DELETE` | `/:id` | Required | Deletes a todo item (enforces ownership). |
| `PUT` | `/reorder` | Required | Reorders todo list items atomically. |

### Health (`/api/v1/health`)
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Public | Health probe checking API readiness and database connectivity. |

---

## 4. Database Layer & Prisma ORM

The data layer uses Prisma with PostgreSQL 17:
- **Schema:** Defined in `prisma/schema.prisma`.
- **Migrations:** Applied via `npx prisma migrate dev` (development) or `npx prisma migrate deploy` (production).
- **Cascade Deletion:** Foreign key constraints automatically delete `RefreshToken` and `Todo` records when a `User` is deleted.

---

## 5. Development & Testing Commands

```bash
# Generate Prisma Client
npx prisma generate

# Run unit tests
npm run test

# Run end-to-end integration tests on PostgreSQL
npm run test:e2e

# Run test coverage with auth module floor enforcement
npm run test:cov

# Code linting & type checking
npm run lint
npm run typecheck
```
