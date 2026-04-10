FROM node:20.14.0-alpine3.20 AS builder

WORKDIR /app

RUN apk add --no-cache openssl libssl3

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

RUN npm run build

FROM node:20.14.0-alpine3.20

RUN apk add --no-cache libssl3

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client /app/node_modules/@prisma/client
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/prisma /app/prisma
COPY --from=builder /app/node_modules /app/node_modules
COPY prisma ./prisma/

RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

USER nodejs

EXPOSE ${PORT:-3001}

CMD ["node", "dist/src/main"]