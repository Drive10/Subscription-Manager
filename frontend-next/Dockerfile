FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN mkdir -p public || true

RUN NODE_ENV=production npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/.next/standalone /app

COPY --from=builder /app/.next/static /app/.next/static

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.js ./

RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

USER nodejs

EXPOSE ${PORT:-3000}

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://subkeeper_backend:3001}

CMD ["node", "server.js"]