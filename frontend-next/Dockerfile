FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN mkdir -p public || true

RUN NODE_ENV=production npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public 2>/dev/null || true
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/next.config.js /app/

RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

USER nodejs

EXPOSE ${PORT:-3000}

ENV NODE_ENV=production

CMD ["node", "next/standalone/server.js"]