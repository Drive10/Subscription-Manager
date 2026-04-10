# Multi-stage Dockerfile for Subscription-Manager
# Can build frontend only, backend only, or both depending on target

# ========== BACKEND BUILD STAGE ==========
FROM node:20.14.0-alpine3.20 AS backend-builder

# Install backend dependencies
WORKDIR /app/backend

RUN apk add --no-cache openssl libssl3

COPY backend-nest/package*.json ./
RUN npm ci

COPY backend-nest/prisma ./prisma/
RUN npx prisma generate

COPY backend-nest/ .
RUN npm run build

# ========== FRONTEND BUILD STAGE ==========
FROM node:20-alpine AS frontend-builder

# Install frontend dependencies
WORKDIR /app/frontend

COPY frontend-next/package*.json ./
RUN npm ci

COPY frontend-next/ .
RUN mkdir -p public || true

RUN NODE_ENV=production npm run build

# ========== PRODUCTION STAGE ==========
FROM node:20-alpine AS production

# Create app directory
WORKDIR /app

# Install production dependencies for backend
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY --from=backend-builder /app/backend/package*.json ./

# Copy frontend static files
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder /app/frontend/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

USER nodejs

# Expose ports (backend will use 3001, frontend served via nginx on 80)
EXPOSE 3001

# Default command - can be overridden in docker-compose
CMD ["node", "dist/src/main"]