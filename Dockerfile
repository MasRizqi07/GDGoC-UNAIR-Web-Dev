# Stage 1: Build API & Contracts
FROM node:25-alpine AS builder

WORKDIR /app

# Build tools for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm ci

COPY packages/contracts/ ./packages/contracts/
COPY apps/api/ ./apps/api/
COPY apps/web/dist/ ./apps/web/dist/

RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build --workspace=@gdgoc/contracts
RUN npm run build --workspace=apps/api

# Stage 2: Production Runtime
FROM node:25-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache wget

COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/package-lock.json ./package-lock.json
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages/contracts ./packages/contracts
COPY --chown=node:node --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --chown=node:node --from=builder /app/apps/api/dist ./apps/api/dist
COPY --chown=node:node --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --chown=node:node --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --chown=node:node --from=builder /app/apps/web/dist ./apps/web/dist

USER node

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma && node apps/api/dist/main.js"]
